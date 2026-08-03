import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, zodValidationError, isUniqueConstraint } from "@/lib/server/api";
import { logAudit, createActivity, createNotification } from "@/lib/server/records";
import { quoteSchema } from "@/lib/validation/entities";
import { calculateTotals, formatLineItems, nextQuoteNumber, quoteToUI, type QuoteWithRelations } from "@/lib/server/billing";
import type { Prisma, QuoteStatus } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

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

  const where: Prisma.QuoteWhereInput = { archivedAt: null };
  if (search) {
    where.OR = [
      { quoteNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { company: { companyName: { contains: search, mode: "insensitive" } } },
      { opportunity: { title: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (filters) {
    try {
      const parsed = JSON.parse(filters) as Record<string, unknown>;
      if (parsed.status) where.status = parsed.status as QuoteStatus;
      if (parsed.customerId) where.customerId = String(parsed.customerId);
      if (parsed.companyId) where.companyId = String(parsed.companyId);
      if (parsed.opportunityId) where.opportunityId = String(parsed.opportunityId);
      if (parsed.leadId) where.leadId = String(parsed.leadId);
    } catch {
      /* ignore invalid JSON */
    }
  }

  const orderBy: Prisma.QuoteOrderByWithRelationInput = {};
  if (sortBy === "customer") orderBy.customer = { name: sortOrder };
  else if (sortBy === "company") orderBy.company = { companyName: sortOrder };
  else if (sortBy === "opportunity") orderBy.opportunity = { title: sortOrder };
  else (orderBy as Record<string, string>)[sortBy] = sortOrder;

  try {
    const [data, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: true,
          company: true,
          opportunity: true,
          lead: true,
          createdBy: true,
          items: true,
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quote.count({ where }),
    ]);
    return NextResponse.json({
      data: data.map(quoteToUI),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    logServerError("GET /api/quotes", err);
    return serverError("Failed to fetch quotes");
  }
}

const quoteInclude = {
  customer: true,
  company: true,
  opportunity: true,
  lead: true,
  createdBy: true,
  items: true,
} as const;

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = quoteSchema.parse(body);
    const lineItems = formatLineItems(parsed.items);
    const totals = calculateTotals(parsed.items, parsed.discount, parsed.taxRate);

    const created = await createQuoteWithRetry({
      currency: parsed.currency ?? "USD",
      status: "DRAFT",
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
      notes: parsed.notes,
      customer: parsed.customerId ? { connect: { id: parsed.customerId } } : undefined,
      company: parsed.companyId ? { connect: { id: parsed.companyId } } : undefined,
      opportunity: parsed.opportunityId ? { connect: { id: parsed.opportunityId } } : undefined,
      lead: parsed.leadId ? { connect: { id: parsed.leadId } } : undefined,
      createdBy: { connect: { id: user.id } },
      items: {
        create: lineItems.map((i) => ({
          name: i.name,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.amount,
        })),
      },
    });

    await logAudit({
      entityType: "quote",
      entityId: created.id,
      action: "quote.created",
      description: `Quote ${created.quoteNumber} created for ${created.customer?.name ?? "customer"} ($${created.total.toLocaleString()})`,
      userId: user.id,
      after: { quoteNumber: created.quoteNumber, total: created.total, status: created.status },
    });
    await createActivity({
      type: "Note",
      subject: `Quote ${created.quoteNumber} created`,
      description: `Quote created for ${created.customer?.name ?? "customer"} totalling $${created.total.toLocaleString()}`,
      status: "Completed",
      leadId: created.leadId,
      opportunityId: created.opportunityId,
      customerId: created.customerId,
    });
    if (created.opportunityId) {
      await createNotification({
        userId: user.id,
        type: "Success",
        title: `Quote ${created.quoteNumber} created`,
        message: `Quote created for ${created.customer?.name ?? "customer"} totalling $${created.total.toLocaleString()}`,
        entityType: "opportunity",
        entityId: created.opportunityId,
        actionLink: `/quotes/${created.id}`,
      });
    }

    return NextResponse.json(quoteToUI(created), { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return zodValidationError(err, "QUOTE_VALIDATION_FAILED", "At least one valid line item is required.");
    }
    logServerError("POST /api/quotes", err);
    return serverError("Failed to create quote");
  }
}

/**
 * Creates a quote, retrying with a freshly generated number when a
 * concurrent create races on the unique `quoteNumber` column.
 */
async function createQuoteWithRetry(
  data: Omit<Prisma.QuoteCreateInput, "quoteNumber">
): Promise<QuoteWithRelations> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const quoteNumber = await nextQuoteNumber();
    try {
      return await prisma.quote.create({
        data: { ...data, quoteNumber },
        include: quoteInclude,
      });
    } catch (err) {
      if (!isUniqueConstraint(err)) throw err;
    }
  }
  throw new Error("Could not allocate a unique quote number");
}
