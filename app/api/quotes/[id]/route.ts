import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, badRequest } from "@/lib/server/api";
import { logAudit, createActivity } from "@/lib/server/records";
import { quoteSchema, quoteStatusSchema } from "@/lib/validation/entities";
import { calculateTotals, formatLineItems, quoteToUI } from "@/lib/server/billing";
import type { Prisma, QuoteStatus } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

const include = {
  customer: true,
  company: true,
  opportunity: true,
  lead: true,
  createdBy: true,
  items: true,
} as const;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const quote = await prisma.quote.findUnique({ where: { id }, include });
    if (!quote) return notFound("Quote not found");
    return NextResponse.json(quoteToUI(quote));
  } catch (err) {
    logServerError(`GET /api/quotes/${id}`, err);
    return serverError("Failed to fetch quote");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const existing = await prisma.quote.findUnique({ where: { id }, include: { items: true } });
    if (!existing) return notFound("Quote not found");

    // Accept/Reject/Expire via a pure status payload (edit payloads always include status too)
    const bodyKeys = Object.keys(body);
    if (bodyKeys.length > 0 && bodyKeys.every((k) => k === "status")) {
      const statusParsed = quoteStatusSchema.parse(body);
      const updated = await prisma.quote.update({
        where: { id },
        data: { status: statusParsed.status },
        include,
      });
      await logAudit({
        entityType: "quote",
        entityId: id,
        action: "quote.status",
        description: `Quote ${updated.quoteNumber} status changed to ${updated.status}`,
        userId: user.id,
        before: { status: existing.status },
        after: { status: updated.status },
      });
      await createActivity({
        type: "Note",
        subject: `Quote ${updated.quoteNumber} ${updated.status}`,
        description: `Quote ${updated.quoteNumber} status changed to ${updated.status}`,
        status: "Completed",
        leadId: updated.leadId,
        opportunityId: updated.opportunityId,
        customerId: updated.customerId,
      });
      return NextResponse.json(quoteToUI(updated));
    }

    const parsed = quoteSchema.partial().parse(body);
    const data: Prisma.QuoteUpdateInput = {};
    const changes: string[] = [];

    if (parsed.currency !== undefined) data.currency = parsed.currency;
    if (parsed.validUntil !== undefined) {
      data.validUntil = parsed.validUntil ? new Date(parsed.validUntil) : null;
    }
    if (parsed.notes !== undefined) {
      data.notes = parsed.notes || null;
      changes.push("notes updated");
    }
    if (parsed.discount !== undefined || parsed.taxRate !== undefined || parsed.items !== undefined) {
      const discount = parsed.discount ?? existing.discount;
      const taxRate = parsed.taxRate ?? (existing.subtotal > 0 ? (existing.tax / existing.subtotal) * 100 : 0);
      const items = parsed.items ?? existing.items.map((i) => ({ name: i.name, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice }));
      const lineItems = formatLineItems(items);
      const totals = calculateTotals(items, discount, taxRate);
      data.subtotal = totals.subtotal;
      data.tax = totals.tax;
      data.discount = totals.discount;
      data.total = totals.total;
      data.items = parsed.items
        ? { deleteMany: {}, create: lineItems.map((i) => ({ name: i.name, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, amount: i.amount })) }
        : undefined;
      changes.push("line items updated");
    }
    if (parsed.customerId !== undefined) {
      data.customer = parsed.customerId ? { connect: { id: parsed.customerId } } : { disconnect: true };
    }
    if (parsed.companyId !== undefined) {
      data.company = parsed.companyId ? { connect: { id: parsed.companyId } } : { disconnect: true };
    }
    if (parsed.opportunityId !== undefined) {
      data.opportunity = parsed.opportunityId ? { connect: { id: parsed.opportunityId } } : { disconnect: true };
    }
    if (parsed.leadId !== undefined) {
      data.lead = parsed.leadId ? { connect: { id: parsed.leadId } } : { disconnect: true };
    }

    const updated = await prisma.quote.update({ where: { id }, data, include });

    if (changes.length > 0) {
      await logAudit({
        entityType: "quote",
        entityId: id,
        action: "quote.updated",
        description: changes.join(", "),
        userId: user.id,
        before: { ...existing } as Record<string, unknown>,
        after: { ...updated } as Record<string, unknown>,
      });
      await createActivity({
        type: "Note",
        subject: `Quote ${updated.quoteNumber} updated`,
        description: changes.join(", "),
        status: "Completed",
        leadId: updated.leadId,
        opportunityId: updated.opportunityId,
        customerId: updated.customerId,
      });
    }

    return NextResponse.json(quoteToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/quotes/${id}`, err);
    return serverError("Failed to update quote");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) return notFound("Quote not found");
    await prisma.quote.update({ where: { id }, data: { archivedAt: new Date() } });
    await logAudit({
      entityType: "quote",
      entityId: id,
      action: "quote.archived",
      description: `Quote ${existing.quoteNumber} archived`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/quotes/${id}`, err);
    return serverError("Failed to archive quote");
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Explicit status transitions (accept/reject) via POST action
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const status = body?.status as QuoteStatus | undefined;
    if (!status) return badRequest("Status is required");
    if (!["ACCEPTED", "REJECTED", "SENT", "EXPIRED"].includes(status)) return badRequest("Invalid status transition");
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) return notFound("Quote not found");
    const updated = await prisma.quote.update({ where: { id }, data: { status }, include });
    await logAudit({
      entityType: "quote",
      entityId: id,
      action: "quote.status",
      description: `Quote ${updated.quoteNumber} marked ${updated.status}`,
      userId: user.id,
      before: { status: existing.status },
      after: { status: updated.status },
    });
    await createActivity({
      type: "Note",
      subject: `Quote ${updated.quoteNumber} ${updated.status}`,
      description: `Quote ${updated.quoteNumber} was ${updated.status}`,
      status: "Completed",
      leadId: updated.leadId,
      opportunityId: updated.opportunityId,
      customerId: updated.customerId,
    });
    return NextResponse.json(quoteToUI(updated));
  } catch (err) {
    logServerError(`POST /api/quotes/${id}`, err);
    return serverError("Failed to update quote status");
  }
}
