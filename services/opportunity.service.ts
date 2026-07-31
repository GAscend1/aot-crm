import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

export interface Opportunity {
  id: string;
  title: string;
  customer: string;
  value: number;
  stage: "Discovery" | "Qualification" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  probability: number;
  expectedCloseDate: string;
  owner: string;
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
