import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  position: string;
  country: string;
  city: string;
  status: "Active" | "Inactive" | "Prospect" | "Blocked";
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class CustomerService extends BaseService<Customer> {
  protected repository: IRepository<Customer>;
  protected entityName = "customer";

  constructor(repository: IRepository<Customer>) {
    super();
    this.repository = repository;
  }
}
