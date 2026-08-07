import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, badRequest, isUniqueConstraint, subscriptionWriteGate, featureGate } from "@/lib/server/api";
import { logAudit, createActivity, createNotification } from "@/lib/server/records";
import { nextInvoiceNumber, invoiceToUI, type InvoiceWithRelations } from "@/lib/server/billing";
import type { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await featureGate(user, "quotes");
  if (gate) return gate;
  const subGate = await subscriptionWriteGate(user);
  if (subGate) return subGate;
  const { id } = await params;
  try {
    const existing = await prisma.quote.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { items: true, invoices: { select: { id: true } } },
    });
    if (!existing) return notFound("Quote not found");
    if (existing.status !== "ACCEPTED") {
      return badRequest("Only accepted quotes can be converted to invoices");
    }
    if (existing.invoices.length > 0) {
      return badRequest("This quote has already been converted to an invoice");
    }

    const invoiceNumber = await nextInvoiceNumber();
    const created = await createInvoiceFromQuote(
      existing.id,
      {
        invoiceNumber,
        organizationId: user.organizationId,
        status: "ISSUED",
        currency: existing.currency,
        subtotal: existing.subtotal,
        tax: existing.tax,
        discount: existing.discount,
        total: existing.total,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: `Converted from quote ${existing.quoteNumber}. ${existing.notes ?? ""}`.trim(),
        quoteId: existing.id,
        customerId: existing.customerId,
        companyId: existing.companyId,
        opportunityId: existing.opportunityId,
        leadId: existing.leadId,
        createdById: user.id,
        items: {
          create: existing.items.map((i) => ({
            name: i.name,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            amount: i.amount,
          })),
        },
      }
    );

    await logAudit({
      entityType: "invoice",
      entityId: created.id,
      action: "invoice.created",
      description: `Invoice ${created.invoiceNumber} created from quote ${existing.quoteNumber} ($${created.total.toLocaleString()})`,
      userId: user.id,
      organizationId: user.organizationId,
      data: { quoteId: existing.id },
    });
    await logAudit({
      entityType: "quote",
      entityId: existing.id,
      action: "quote.converted",
      description: `Quote ${existing.quoteNumber} converted to invoice ${created.invoiceNumber}`,
      userId: user.id,
      organizationId: user.organizationId,
    });
    await createActivity({
      type: "Note",
      subject: `Invoice ${created.invoiceNumber} created`,
      description: `Invoice created from accepted quote ${existing.quoteNumber}`,
      status: "Completed",
      leadId: created.leadId,
      opportunityId: created.opportunityId,
      customerId: created.customerId,
      organizationId: user.organizationId,
    });
    if (created.opportunityId) {
      await createNotification({
        userId: user.id,
        organizationId: user.organizationId,
        type: "Success",
        title: `Invoice ${created.invoiceNumber} created`,
        message: `Invoice created from accepted quote ${existing.quoteNumber}`,
        entityType: "opportunity",
        entityId: created.opportunityId,
        actionLink: `/invoices/${created.id}`,
      });
    }

    return NextResponse.json(invoiceToUI(created), { status: 201 });
  } catch (err) {
    logServerError(`POST /api/quotes/${id}/convert`, err);
    return serverError("Failed to convert quote to invoice");
  }
}

const invoiceInclude = {
  customer: true,
  company: true,
  opportunity: true,
  quote: true,
  lead: true,
  createdBy: true,
  items: true,
} as const;

/**
 * Creates the converted invoice, retrying with a freshly generated number
 * when a concurrent create races on the unique `invoiceNumber` column.
 */
async function createInvoiceFromQuote(
  quoteId: string,
  data: Prisma.InvoiceUncheckedCreateInput
): Promise<InvoiceWithRelations> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const invoiceNumber = await nextInvoiceNumber();
    try {
      return await prisma.invoice.create({
        data: { ...data, invoiceNumber },
        include: invoiceInclude,
      });
    } catch (err) {
      if (!isUniqueConstraint(err)) throw err;
    }
  }
  throw new Error(`Could not allocate a unique invoice number for quote ${quoteId}`);
}
