import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, subscriptionWriteGate, featureGate } from "@/lib/server/api";
import { logAudit, createActivity } from "@/lib/server/records";
import { nextQuoteNumber, quoteToUI } from "@/lib/server/billing";
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
      include: { items: true },
    });
    if (!existing) return notFound("Quote not found");
    const quoteNumber = await nextQuoteNumber();

    const duplicate = await prisma.quote.create({
      data: {
        organizationId: user.organizationId,
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
      organizationId: user.organizationId,
    });
    await createActivity({
      type: "Note",
      subject: `Quote ${duplicate.quoteNumber} created (duplicate)`,
      description: `Duplicated from ${existing.quoteNumber}`,
      status: "Completed",
      leadId: duplicate.leadId,
      opportunityId: duplicate.opportunityId,
      customerId: duplicate.customerId,
      organizationId: user.organizationId,
    });

    return NextResponse.json(quoteToUI(duplicate), { status: 201 });
  } catch (err) {
    logServerError(`POST /api/quotes/${id}/duplicate`, err);
    return serverError("Failed to duplicate quote");
  }
}
