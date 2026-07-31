import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

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
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
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

export class QuoteService extends BaseService<Quote> {
  protected repository: IRepository<Quote>;
  protected entityName = "quote";

  constructor(repository: IRepository<Quote>) {
    super();
    this.repository = repository;
  }
}
