import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, badRequest, subscriptionWriteGate, featureGate } from "@/lib/server/api";
import { logAudit, createActivity, createNotification } from "@/lib/server/records";
import { invoiceCreateSchema, invoiceStatusSchema } from "@/lib/validation/entities";
import { calculateTotals, formatLineItems, invoiceToUI } from "@/lib/server/billing";
import type { InvoiceStatus, Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

const include = {
  customer: true,
  company: true,
  opportunity: true,
  quote: true,
  lead: true,
  createdBy: true,
  items: true,
} as const;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await featureGate(user, "invoices");
  if (gate) return gate;
  const { id } = await params;
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id, organizationId: user.organizationId }, include });
    if (!invoice) return notFound("Invoice not found");
    return NextResponse.json(invoiceToUI(invoice));
  } catch (err) {
    logServerError(`GET /api/invoices/${id}`, err);
    return serverError("Failed to fetch invoice");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await featureGate(user, "invoices");
  if (gate) return gate;
  const subGate = await subscriptionWriteGate(user);
  if (subGate) return subGate;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const existing = await prisma.invoice.findFirst({ where: { id, organizationId: user.organizationId }, include: { items: true } });
    if (!existing) return notFound("Invoice not found");

    // Status transitions (issue, mark paid, void, etc.) — only for pure status payloads,
    // since edit-form payloads also carry a status field and must not be discarded.
    const bodyKeys = Object.keys(body);
    if (bodyKeys.length > 0 && bodyKeys.every((k) => k === "status" || k === "paidAt")) {
      const statusParsed = invoiceStatusSchema.parse(body);
      const data: Prisma.InvoiceUpdateInput = { status: statusParsed.status };
      if (statusParsed.status === "PAID" && !statusParsed.paidAt) data.paidAt = new Date();
      if (statusParsed.paidAt) data.paidAt = new Date(statusParsed.paidAt);
      if (statusParsed.status === "VOID") data.paidAt = null;
      const updated = await prisma.invoice.update({ where: { id }, data, include });
      await logAudit({
        entityType: "invoice",
        entityId: id,
        action: "invoice.status",
        description: `Invoice ${updated.invoiceNumber} status changed to ${updated.status}`,
        userId: user.id,
        before: { status: existing.status },
        after: { status: updated.status },
      });
      await createActivity({
        type: "Note",
        subject: `Invoice ${updated.invoiceNumber} ${updated.status}`,
        description: `Invoice ${updated.invoiceNumber} status changed to ${updated.status}`,
        status: "Completed",
        leadId: updated.leadId,
        opportunityId: updated.opportunityId,
        customerId: updated.customerId,
      });
      if (updated.status === "PAID" && updated.opportunityId) {
        await createNotification({
          userId: user.id,
          type: "Success",
          title: `Invoice ${updated.invoiceNumber} paid`,
          message: `Invoice ${updated.invoiceNumber} has been marked as paid`,
          entityType: "opportunity",
          entityId: updated.opportunityId,
          actionLink: `/invoices/${updated.id}`,
        });
      }
      return NextResponse.json(invoiceToUI(updated));
    }

    const parsed = invoiceCreateSchema.partial().parse(body);
    const data: Prisma.InvoiceUpdateInput = {};
    const changes: string[] = [];

    if (parsed.currency !== undefined) data.currency = parsed.currency;
    if (parsed.dueDate !== undefined) data.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
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
    if (parsed.customerId !== undefined) data.customer = parsed.customerId ? { connect: { id: parsed.customerId } } : { disconnect: true };
    if (parsed.companyId !== undefined) data.company = parsed.companyId ? { connect: { id: parsed.companyId } } : { disconnect: true };
    if (parsed.opportunityId !== undefined) data.opportunity = parsed.opportunityId ? { connect: { id: parsed.opportunityId } } : { disconnect: true };
    if (parsed.leadId !== undefined) data.lead = parsed.leadId ? { connect: { id: parsed.leadId } } : { disconnect: true };

    const updated = await prisma.invoice.update({ where: { id }, data, include });

    if (changes.length > 0) {
      await logAudit({
        entityType: "invoice",
        entityId: id,
        action: "invoice.updated",
        description: changes.join(", "),
        userId: user.id,
        before: { ...existing } as Record<string, unknown>,
        after: { ...updated } as Record<string, unknown>,
      });
      await createActivity({
        type: "Note",
        subject: `Invoice ${updated.invoiceNumber} updated`,
        description: changes.join(", "),
        status: "Completed",
        leadId: updated.leadId,
        opportunityId: updated.opportunityId,
        customerId: updated.customerId,
      });
    }

    return NextResponse.json(invoiceToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/invoices/${id}`, err);
    return serverError("Failed to update invoice");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await featureGate(user, "invoices");
  if (gate) return gate;
  const subGate = await subscriptionWriteGate(user);
  if (subGate) return subGate;
  const { id } = await params;
  try {
    const existing = await prisma.invoice.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return notFound("Invoice not found");
    await prisma.invoice.update({ where: { id }, data: { archivedAt: new Date() } });
    await logAudit({
      entityType: "invoice",
      entityId: id,
      action: "invoice.archived",
      description: `Invoice ${existing.invoiceNumber} archived`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/invoices/${id}`, err);
    return serverError("Failed to archive invoice");
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await featureGate(user, "invoices");
  if (gate) return gate;
  const subGate = await subscriptionWriteGate(user);
  if (subGate) return subGate;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const status = body?.status as InvoiceStatus | undefined;
    if (!status) return badRequest("Status is required");
    if (!["ISSUED", "PARTIALLY_PAID", "PAID", "VOID", "OVERDUE"].includes(status)) return badRequest("Invalid status transition");
    const existing = await prisma.invoice.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) return notFound("Invoice not found");
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : status === "VOID" ? null : undefined,
      },
      include,
    });
    await logAudit({
      entityType: "invoice",
      entityId: id,
      action: "invoice.status",
      description: `Invoice ${updated.invoiceNumber} marked ${updated.status}`,
      userId: user.id,
      before: { status: existing.status },
      after: { status: updated.status },
    });
    await createActivity({
      type: "Note",
      subject: `Invoice ${updated.invoiceNumber} ${updated.status}`,
      description: `Invoice ${updated.invoiceNumber} was ${updated.status}`,
      status: "Completed",
      leadId: updated.leadId,
      opportunityId: updated.opportunityId,
      customerId: updated.customerId,
    });
    if (updated.status === "PAID" && updated.opportunityId) {
      await createNotification({
        userId: user.id,
        type: "Success",
        title: `Invoice ${updated.invoiceNumber} paid`,
        message: `Invoice ${updated.invoiceNumber} has been marked as paid`,
        entityType: "opportunity",
        entityId: updated.opportunityId,
        actionLink: `/invoices/${updated.id}`,
      });
    }
    return NextResponse.json(invoiceToUI(updated));
  } catch (err) {
    logServerError(`POST /api/invoices/${id}`, err);
    return serverError("Failed to update invoice status");
  }
}
