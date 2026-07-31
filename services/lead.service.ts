import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

export interface Lead {
  id: string;
  title: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  source: "Website" | "Referral" | "LinkedIn" | "Conference" | "Cold Call" | "Other";
  score: number;
  probability: number;
  owner: string;
  ownerId: string;
  expectedRevenue: number;
  expectedCloseDate: string;
  isFavorite: boolean;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  notes: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export class LeadService extends BaseService<Lead> {
  protected repository: IRepository<Lead>;
  protected entityName = "lead";

  constructor(repository: IRepository<Lead>) {
    super();
    this.repository = repository;
  }
}
