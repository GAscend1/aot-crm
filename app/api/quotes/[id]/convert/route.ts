import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, badRequest } from "@/lib/server/api";
import { logAudit, createActivity } from "@/lib/server/records";
import { nextInvoiceNumber, invoiceToUI } from "@/lib/server/billing";
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.quote.findUnique({
      where: { id },
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
    const created = await prisma.invoice.create({
      data: {
        invoiceNumber,
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
      },
      include: {
        customer: true,
        company: true,
        opportunity: true,
        quote: true,
        lead: true,
        createdBy: true,
        items: true,
      },
    });

    await logAudit({
      entityType: "invoice",
      entityId: created.id,
      action: "invoice.created",
      description: `Invoice ${created.invoiceNumber} created from quote ${existing.quoteNumber} ($${created.total.toLocaleString()})`,
      userId: user.id,
      data: { quoteId: existing.id },
    });
    await logAudit({
      entityType: "quote",
      entityId: existing.id,
      action: "quote.converted",
      description: `Quote ${existing.quoteNumber} converted to invoice ${created.invoiceNumber}`,
      userId: user.id,
    });
    await createActivity({
      type: "Note",
      subject: `Invoice ${created.invoiceNumber} created`,
      description: `Invoice created from accepted quote ${existing.quoteNumber}`,
      status: "Completed",
      leadId: created.leadId,
      opportunityId: created.opportunityId,
      customerId: created.customerId,
    });

    return NextResponse.json(invoiceToUI(created), { status: 201 });
  } catch (err) {
    logServerError(`POST /api/quotes/${id}/convert`, err);
    return serverError("Failed to convert quote to invoice");
  }
}
