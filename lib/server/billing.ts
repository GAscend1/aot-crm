import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface LineItemInput {
  name?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

/** Server-side financial calculation. Discount is a flat amount, tax is a rate (% of subtotal). */
export function calculateTotals(items: LineItemInput[], discount = 0, taxRate = 0): Totals {
  const subtotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitPrice || 0), 0);
  const tax = subtotal * ((taxRate || 0) / 100);
  const total = subtotal - (discount || 0) + tax;
  return { subtotal, discount: discount || 0, tax, total };
}

export function formatLineItems(
  items: LineItemInput[]
): { name: string; description: string; quantity: number; unitPrice: number; amount: number }[] {
  return items.map((i) => ({
    name: i.name || "",
    description: i.description,
    quantity: i.quantity || 0,
    unitPrice: i.unitPrice || 0,
    amount: (i.quantity || 0) * (i.unitPrice || 0),
  }));
}

/** Generate the next sequential quote number: QT-0001, QT-0002, ... */
export async function nextQuoteNumber(): Promise<string> {
  const result = await prisma.$queryRawUnsafe<{ next: string }[]>(
    `SELECT 'QT-' || LPAD(COALESCE(MAX(CAST(SUBSTRING("quoteNumber" FROM 4) AS INTEGER)), 0) + 1::int, 4, '0') AS next FROM "Quote"`
  );
  return result?.[0]?.next ?? "QT-0001";
}

/** Generate the next sequential invoice number: INV-0001, INV-0002, ... */
export async function nextInvoiceNumber(): Promise<string> {
  const result = await prisma.$queryRawUnsafe<{ next: string }[]>(
    `SELECT 'INV-' || LPAD(COALESCE(MAX(CAST(SUBSTRING("invoiceNumber" FROM 5) AS INTEGER)), 0) + 1::int, 4, '0') AS next FROM "Invoice"`
  );
  return result?.[0]?.next ?? "INV-0001";
}

export type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: {
    customer: true;
    company: true;
    opportunity: true;
    lead: true;
    createdBy: true;
    items: true;
  };
}>;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    customer: true;
    company: true;
    opportunity: true;
    quote: true;
    lead: true;
    createdBy: true;
    items: true;
  };
}>;

export interface UIQuote {
  id: string;
  quoteNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validUntil: string;
  notes: string;
  customer: string;
  customerId: string;
  company: string;
  companyId: string;
  opportunity: string;
  opportunityId: string;
  lead: string;
  leadId: string;
  createdBy: string;
  createdById: string;
  items: {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export function quoteToUI(q: QuoteWithRelations): UIQuote {
  return {
    id: q.id,
    quoteNumber: q.quoteNumber,
    status: q.status,
    currency: q.currency,
    subtotal: q.subtotal,
    tax: q.tax,
    discount: q.discount,
    total: q.total,
    validUntil: q.validUntil?.toISOString().split("T")[0] ?? "",
    notes: q.notes ?? "",
    customer: q.customer?.name ?? "",
    customerId: q.customerId ?? "",
    company: q.company?.companyName ?? "",
    companyId: q.companyId ?? "",
    opportunity: q.opportunity?.title ?? "",
    opportunityId: q.opportunityId ?? "",
    lead: q.lead ? `${q.lead.firstName} ${q.lead.lastName}`.trim() || q.lead.companyName || "" : "",
    leadId: q.leadId ?? "",
    createdBy: q.createdBy?.name ?? "",
    createdById: q.createdById ?? "",
    items: q.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.amount,
    })),
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  };
}

export interface UIInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  issueDate: string;
  dueDate: string;
  paidAt: string;
  notes: string;
  quote: string;
  quoteId: string;
  customer: string;
  customerId: string;
  company: string;
  companyId: string;
  opportunity: string;
  opportunityId: string;
  lead: string;
  leadId: string;
  createdBy: string;
  createdById: string;
  items: {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export function invoiceToUI(inv: InvoiceWithRelations): UIInvoice {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    status: inv.status,
    currency: inv.currency,
    subtotal: inv.subtotal,
    tax: inv.tax,
    discount: inv.discount,
    total: inv.total,
    issueDate: inv.issueDate.toISOString().split("T")[0],
    dueDate: inv.dueDate?.toISOString().split("T")[0] ?? "",
    paidAt: inv.paidAt?.toISOString() ?? "",
    notes: inv.notes ?? "",
    quote: inv.quote?.quoteNumber ?? "",
    quoteId: inv.quoteId ?? "",
    customer: inv.customer?.name ?? "",
    customerId: inv.customerId ?? "",
    company: inv.company?.companyName ?? "",
    companyId: inv.companyId ?? "",
    opportunity: inv.opportunity?.title ?? "",
    opportunityId: inv.opportunityId ?? "",
    lead: inv.lead ? `${inv.lead.firstName} ${inv.lead.lastName}`.trim() || inv.lead.companyName || "" : "",
    leadId: inv.leadId ?? "",
    createdBy: inv.createdBy?.name ?? "",
    createdById: inv.createdById ?? "",
    items: inv.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.amount,
    })),
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  };
}
