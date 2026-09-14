import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
export const dynamic = "force-dynamic";

const associateSchema = z.object({
  messageId: z.string().min(1, "Message ID is required").max(320),
  subject: z.string().min(1, "Subject is required").max(256),
  description: z.string().max(4096).optional().default(""),
  senderEmail: z.string().optional().default(""),
  senderName: z.string().max(256).optional().default(""),
  receivedAt: z.string().optional(),
  entityType: z.enum(["contact", "company", "lead", "opportunity", "customer"]),
  entityId: z.string().min(1, "Entity ID is required"),
});

/**
 * Explicitly link an email to a CRM record by creating a typed EMAIL Activity
 * (visible in the record's Activity Timeline). Nothing is ever imported
 * automatically — only this explicit user action persists anything.
 *
 * SECURITY: the entity is always resolved org-scoped first; a messageId/entityId
 * from another organization can never be linked or surfaced. Deduplication uses
 * the unique Graph message id (graphMessageId) so refreshing can never create
 * duplicate CRM email activities.
 */
export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  let parsed;
  try {
    parsed = associateSchema.parse(await request.json().catch(() => ({})));
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return NextResponse.json({ error: first?.message || "Invalid request" }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const { entityType, entityId } = parsed;

  try {
    // Resolve the target entity within the CURRENT organization only.
    const where = { id: entityId, organizationId: user.organizationId };
    let entityName: string;
    let href: string;
    if (entityType === "contact") {
      const c = await prisma.contact.findFirst({ where, select: { id: true, firstName: true, lastName: true } });
      if (!c) return NextResponse.json({ error: "Contact not found in your organization" }, { status: 404 });
      entityName = `${c.firstName} ${c.lastName}`.trim();
      href = `/contacts/${c.id}`;
    } else if (entityType === "company") {
      const c = await prisma.company.findFirst({ where, select: { id: true, companyName: true } });
      if (!c) return NextResponse.json({ error: "Company not found in your organization" }, { status: 404 });
      entityName = c.companyName;
      href = `/companies/${c.id}`;
    } else if (entityType === "lead") {
      const l = await prisma.lead.findFirst({ where, select: { id: true, firstName: true, lastName: true, companyName: true } });
      if (!l) return NextResponse.json({ error: "Lead not found in your organization" }, { status: 404 });
      entityName = `${l.firstName} ${l.lastName}`.trim() || l.companyName || "Untitled lead";
      href = `/leads/${l.id}`;
    } else if (entityType === "opportunity") {
      const o = await prisma.opportunity.findFirst({ where, select: { id: true, title: true } });
      if (!o) return NextResponse.json({ error: "Opportunity not found in your organization" }, { status: 404 });
      entityName = o.title;
      href = `/opportunities/${o.id}`;
    } else {
      const c = await prisma.customer.findFirst({ where, select: { id: true, name: true } });
      if (!c) return NextResponse.json({ error: "Customer not found in your organization" }, { status: 404 });
      entityName = c.name;
      href = `/contacts?view=customers&record=${c.id}`;
    }

    // Deduplication: one linked EMAIL activity per Graph message id per entity.
    const linkField = `${entityType}Id` as "contactId" | "companyId" | "leadId" | "opportunityId" | "customerId";
    const existing = await prisma.activity.findFirst({
      where: { organizationId: user.organizationId, graphMessageId: parsed.messageId, [linkField]: entityId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ id: existing.id, duplicate: true, entityName, href });
    }

    const receivedAt = parsed.receivedAt && !Number.isNaN(Date.parse(parsed.receivedAt))
      ? new Date(parsed.receivedAt)
      : new Date();

    const created = await prisma.activity.create({
      data: {
        organizationId: user.organizationId,
        type: "Email",
        subject: parsed.subject,
        description: parsed.description || undefined,
        status: "Completed",
        completedAt: receivedAt,
        dueDate: receivedAt,
        graphMessageId: parsed.messageId,
        contactId: entityType === "contact" ? entityId : null,
        companyId: entityType === "company" ? entityId : null,
        leadId: entityType === "lead" ? entityId : null,
        opportunityId: entityType === "opportunity" ? entityId : null,
        customerId: entityType === "customer" ? entityId : null,
      },
    });

    await logAudit({
      entityType: "activity",
      entityId: created.id,
      action: "activity.created",
      description: `Email "${parsed.subject}" linked to ${entityName}`,
      userId: user.id,
      organizationId: user.organizationId,
      data: { entityType, entityId, graphMessageId: parsed.messageId },
    });

    return NextResponse.json({ id: created.id, duplicate: false, entityName, href }, { status: 201 });
  } catch (err) {
    logServerError("POST /api/email/associate", err);
    return serverError("Failed to link email to record");
  }
}
