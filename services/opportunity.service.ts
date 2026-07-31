import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

export interface Opportunity {
  id: string;
  title: string;
  customer: string;
  customerId?: string;
  company?: string;
  companyId?: string;
  contact?: string;
  leadId?: string;
  leadName?: string;
  leadSource?: string;
  value: number;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  stage: "Discovery" | "Qualification" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  stageId?: string;
  probability: number;
  expectedCloseDate: string;
  owner: string;
  ownerId?: string;
  notes: string;
  status: "Open" | "Won" | "Lost";
  createdAt: string;
  updatedAt: string;
}

export class OpportunityService extends BaseService<Opportunity> {
  protected repository: IRepository<Opportunity>;
  protected entityName = "opportunity";

  constructor(repository: IRepository<Opportunity>) {
    super();
    this.repository = repository;
  }
}
