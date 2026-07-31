import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit, createActivity } from "@/lib/server/records";
import { nextQuoteNumber, quoteToUI } from "@/lib/server/billing";
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.quote.findUnique({ where: { id }, include: { items: true } });
    if (!existing) return notFound("Quote not found");
    const quoteNumber = await nextQuoteNumber();

    const duplicate = await prisma.quote.create({
      data: {
        quoteNumber,
        status: "DRAFT",
        currency: existing.currency,
        subtotal: existing.subtotal,
        tax: existing.tax,
        discount: existing.discount,
        total: existing.total,
        validUntil: existing.validUntil,
        notes: existing.notes ? `Copy of ${existing.quoteNumber}. ${existing.notes}` : `Copy of ${existing.quoteNumber}`,
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
        lead: true,
        createdBy: true,
        items: true,
      },
    });

    await logAudit({
      entityType: "quote",
      entityId: duplicate.id,
      action: "quote.duplicated",
      description: `Quote ${existing.quoteNumber} duplicated as ${duplicate.quoteNumber}`,
      userId: user.id,
    });
    await createActivity({
      type: "Note",
      subject: `Quote ${duplicate.quoteNumber} created (duplicate)`,
      description: `Duplicated from ${existing.quoteNumber}`,
      status: "Completed",
      leadId: duplicate.leadId,
      opportunityId: duplicate.opportunityId,
      customerId: duplicate.customerId,
    });

    return NextResponse.json(quoteToUI(duplicate), { status: 201 });
  } catch (err) {
    logServerError(`POST /api/quotes/${id}/duplicate`, err);
    return serverError("Failed to duplicate quote");
  }
}
