import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import type { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

type ActivityRow = Prisma.ActivityGetPayload<{
  include: {
    contact: { select: { firstName: true; lastName: true } };
    company: { select: { companyName: true } };
    lead: { select: { firstName: true; lastName: true; companyName: true } };
    opportunity: { select: { title: true } };
    customer: { select: { name: true } };
  };
}>;

function toAssociation(c: ActivityRow) {
  if (c.contactId) return { entityType: "contact", entityId: c.contactId, entityName: `${c.contact?.firstName ?? ""} ${c.contact?.lastName ?? ""}`.trim() };
  if (c.companyId) return { entityType: "company", entityId: c.companyId, entityName: c.company?.companyName ?? "Company" };
  if (c.leadId) return { entityType: "lead", entityId: c.leadId, entityName: `${c.lead?.firstName ?? ""} ${c.lead?.lastName ?? ""}`.trim() || c.lead?.companyName || "Lead" };
  if (c.opportunityId) return { entityType: "opportunity", entityId: c.opportunityId, entityName: c.opportunity?.title ?? "Opportunity" };
  if (c.customerId) return { entityType: "customer", entityId: c.customerId, entityName: c.customer?.name ?? "Customer" };
  return { entityType: "unknown", entityId: "", entityName: "Unknown" };
}

/** CRM records a Graph message is explicitly linked to (org-scoped). */
export async function GET(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  const messageId = new URL(request.url).searchParams.get("messageId");
  if (!messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  try {
    const activities = await prisma.activity.findMany({
      where: { organizationId: user.organizationId, graphMessageId: messageId },
      include: {
        contact: { select: { firstName: true, lastName: true } },
        company: { select: { companyName: true } },
        lead: { select: { firstName: true, lastName: true, companyName: true } },
        opportunity: { select: { title: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = activities.map((a) => ({
      id: a.id,
      subject: a.subject,
      linkedAt: a.createdAt.toISOString(),
      ...toAssociation(a),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    logServerError("GET /api/email/associations", err);
    return serverError("Failed to load email associations");
  }
}
