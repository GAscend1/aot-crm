import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

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
  status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID";
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

export class InvoiceService extends BaseService<Invoice> {
  protected repository: IRepository<Invoice>;
  protected entityName = "invoice";

  constructor(repository: IRepository<Invoice>) {
    super();
    this.repository = repository;
  }
}
