export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface QuoteLineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  tax: number;
  taxRate?: number;
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
  items: QuoteLineItem[];
  createdAt: string;
  updatedAt: string;
}

export const quoteStatusColors: Record<QuoteStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};
