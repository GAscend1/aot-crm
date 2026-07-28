import { BaseService } from "./base/BaseService";
import { MockRepository } from "@/repositories/mock/MockRepository";

interface Lead {
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
  expectedRevenue: number;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  notes: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export class LeadService extends BaseService<Lead> {
  protected repository: MockRepository<Lead>;
  protected entityName = "lead";

  constructor(initialData: Lead[] = []) {
    super();
    this.repository = new MockRepository<Lead>(initialData);
  }
}

export type { Lead };
