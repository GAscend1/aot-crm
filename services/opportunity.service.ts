import { BaseService } from "./base/BaseService";
import { MockRepository } from "@/repositories/mock/MockRepository";

interface Opportunity {
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
  protected repository: MockRepository<Opportunity>;

  constructor(initialData: Opportunity[] = []) {
    super();
    this.repository = new MockRepository<Opportunity>(initialData);
  }
}

export type { Opportunity };
