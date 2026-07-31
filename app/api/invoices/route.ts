import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { logAudit, createActivity, createNotification } from "@/lib/server/records";
import { invoiceCreateSchema } from "@/lib/validation/entities";
import { calculateTotals, formatLineItems, nextInvoiceNumber, invoiceToUI } from "@/lib/server/billing";
import type { Prisma, InvoiceStatus } from "@/generated/prisma/client";
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

  const where: Prisma.InvoiceWhereInput = { archivedAt: null };
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { company: { companyName: { contains: search, mode: "insensitive" } } },
      { opportunity: { title: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (filters) {
    try {
      const parsed = JSON.parse(filters) as Record<string, unknown>;
      if (parsed.status) where.status = parsed.status as InvoiceStatus;
      if (parsed.customerId) where.customerId = String(parsed.customerId);
      if (parsed.companyId) where.companyId = String(parsed.companyId);
      if (parsed.opportunityId) where.opportunityId = String(parsed.opportunityId);
      if (parsed.quoteId) where.quoteId = String(parsed.quoteId);
    } catch {
      /* ignore invalid JSON */
    }
  }

  const orderBy: Prisma.InvoiceOrderByWithRelationInput = {};
  if (sortBy === "customer") orderBy.customer = { name: sortOrder };
  else if (sortBy === "company") orderBy.company = { companyName: sortOrder };
  else if (sortBy === "opportunity") orderBy.opportunity = { title: sortOrder };
  else (orderBy as Record<string, string>)[sortBy] = sortOrder;

  try {
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);
    return NextResponse.json({
      data: data.map(invoiceToUI),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    logServerError("GET /api/invoices", err);
    return serverError("Failed to fetch invoices");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = invoiceCreateSchema.parse(body);
    const items = parsed.items ?? [];
    const lineItems = formatLineItems(items);
    const totals = calculateTotals(items, parsed.discount, parsed.taxRate);
    const invoiceNumber = await nextInvoiceNumber();

    const created = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: "DRAFT",
        currency: parsed.currency ?? "USD",
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        issueDate: new Date(),
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: parsed.notes,
        quote: parsed.quoteId ? { connect: { id: parsed.quoteId } } : undefined,
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
      },
      include,
    });

    await logAudit({
      entityType: "invoice",
      entityId: created.id,
      action: "invoice.created",
      description: `Invoice ${created.invoiceNumber} created ($${created.total.toLocaleString()})`,
      userId: user.id,
      after: { invoiceNumber: created.invoiceNumber, total: created.total, status: created.status },
    });
    await createActivity({
      type: "Note",
      subject: `Invoice ${created.invoiceNumber} created`,
      description: `Invoice created for ${created.customer?.name ?? "customer"} totalling $${created.total.toLocaleString()}`,
      status: "Completed",
      leadId: created.leadId,
      opportunityId: created.opportunityId,
      customerId: created.customerId,
    });
    if (created.opportunityId) {
      await createNotification({
        userId: user.id,
        type: "Success",
        title: `Invoice ${created.invoiceNumber} created`,
        message: `Invoice created for ${created.customer?.name ?? "customer"} totalling $${created.total.toLocaleString()}`,
        entityType: "opportunity",
        entityId: created.opportunityId,
        actionLink: `/invoices/${created.id}`,
      });
    }

    return NextResponse.json(invoiceToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/invoices", err);
    return serverError("Failed to create invoice");
  }
}
