export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";

export interface InvoiceLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax: number;
  taxRate?: number;
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
  items: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-slate-200 text-slate-500",
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};
