import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, zodValidationError, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit, findOrCreateCompany } from "@/lib/server/records";
import { contactSchema } from "@/lib/validation/entities";
export const dynamic = "force-dynamic";

export type UIContact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  role: string;
  company: string;
  companyId: string | null;
  country: string;
  city: string;
  notes: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function contactToUI(c: Prisma.ContactGetPayload<{ include: { company: true } }>): UIContact {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email ?? "",
    phone: c.phone ?? "",
    position: c.position ?? "",
    role: c.role ?? "",
    company: c.company?.companyName ?? "",
    companyId: c.companyId,
    country: c.country ?? "",
    city: c.city ?? "",
    notes: c.notes ?? "",
    tags: Array.isArray(c.tags) ? c.tags as string[] : [],
    status: c.status ?? "Active",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")));
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";
  const search = searchParams.get("search") ?? "";
  const filters = searchParams.get("filters");

  const where: Prisma.ContactWhereInput = { organizationId: user.organizationId };
  if (searchParams.get("includeArchived") !== "true") where.archivedAt = null;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (filters) {
    try {
      const parsed = JSON.parse(filters) as Record<string, unknown>;
      if (parsed.companyId) where.companyId = String(parsed.companyId);
    } catch { /* ignore invalid JSON */ }
  }

  const orderBy: Prisma.ContactOrderByWithRelationInput = {};
  if (sortBy === "company") orderBy.company = { companyName: sortOrder };
  else if (sortBy === "name") orderBy.firstName = sortOrder;
  else { (orderBy as Record<string, string>)[sortBy] = sortOrder; }

  try {
    const [data, total] = await Promise.all([
      prisma.contact.findMany({ where, include: { company: true }, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.contact.count({ where }),
    ]);
    return NextResponse.json({ data: data.map(contactToUI), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    logServerError("GET /api/contacts", err);
    return serverError("Failed to fetch contacts");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = contactSchema.parse(body);

    const companyId = parsed.companyId ?? (parsed.company ? await findOrCreateCompany(parsed.company, user.organizationId) : null);
    const data: Prisma.ContactCreateInput = {
      organization: { connect: { id: user.organizationId } },
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      position: parsed.position || undefined,
      role: parsed.role || undefined,
      country: parsed.country || undefined,
      city: parsed.city || undefined,
      notes: parsed.notes || undefined,
      tags: parsed.tags ?? [],
      status: parsed.status ?? "Active",
      company: companyId ? { connect: { id: companyId } } : undefined,
    };
    const created = await prisma.contact.create({ data, include: { company: true } });

    await logAudit({
      entityType: "contact",
      entityId: created.id,
      action: "contact.created",
      description: `Contact "${created.firstName} ${created.lastName}" created`,
      userId: user.id,
      organizationId: user.organizationId,
    });

    return NextResponse.json(contactToUI(created), { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return zodValidationError(err, "CONTACT_VALIDATION_FAILED", "Invalid contact data.");
    }
    logServerError("POST /api/contacts", err);
    return serverError("Failed to create contact");
  }
}
