import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import {
  matchAddressesToRecords,
  matchCompaniesByDomain,
  type EmailMatchResult,
} from "@/lib/email-match";
export const dynamic = "force-dynamic";

/**
 * Org-scoped CRM context for an email's sender/recipient addresses.
 *
 * SECURITY: every query is scoped with `organizationId: user.organizationId`
 * server-side. A cross-organization address can never surface a record from
 * another tenant — there is no global email lookup anywhere.
 */
export async function GET(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  const addresses = new URL(request.url).searchParams
    .getAll("addresses")
    .flatMap((v) => v.split(","))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);

  if (addresses.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  try {
    const [contacts, customers, leads, companies] = await Promise.all([
      prisma.contact.findMany({
        where: { organizationId: user.organizationId, email: { in: addresses, mode: "insensitive" } },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          company: { select: { companyName: true } },
        },
        take: 50,
      }),
      prisma.customer.findMany({
        where: { organizationId: user.organizationId, email: { in: addresses, mode: "insensitive" } },
        select: { id: true, name: true, email: true, company: { select: { companyName: true } } },
        take: 50,
      }),
      prisma.lead.findMany({
        where: { organizationId: user.organizationId, email: { in: addresses, mode: "insensitive" } },
        select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
        take: 50,
      }),
      prisma.company.findMany({
        where: { organizationId: user.organizationId, email: { not: null } },
        select: { id: true, companyName: true, email: true },
        take: 500,
      }),
    ]);

    const records = [
      ...contacts.map((c) => ({
        kind: "contact" as const,
        id: c.id,
        name: `${c.firstName} ${c.lastName}`.trim() || "Unknown",
        email: c.email,
        company: c.company?.companyName ?? null,
        href: `/contacts/${c.id}`,
      })),
      ...customers.map((c) => ({
        kind: "customer" as const,
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company?.companyName ?? null,
        href: `/contacts?view=customers&record=${c.id}`,
      })),
      ...leads.map((l) => ({
        kind: "lead" as const,
        id: l.id,
        name: `${l.firstName} ${l.lastName}`.trim() || l.companyName || "Untitled lead",
        email: l.email,
        company: l.companyName,
        href: `/leads/${l.id}`,
      })),
    ];

    const matches: EmailMatchResult[] = [
      ...matchAddressesToRecords(records, addresses),
      ...matchCompaniesByDomain(
        companies.map((c) => ({ id: c.id, name: c.companyName, email: c.email, href: `/companies/${c.id}` })),
        addresses,
      ),
    ];

    // De-duplicate companies that also matched as a contact's company row.
    const seen = new Set<string>();
    const unique = matches.filter((m) => {
      const key = `${m.kind}:${m.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ matches: unique });
  } catch (err) {
    logServerError("GET /api/email/context", err);
    return serverError("Failed to resolve email context");
  }
}
