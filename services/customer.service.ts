import { BaseService } from "./base/BaseService";
import { MockRepository } from "@/repositories/mock/MockRepository";

interface Customer {
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
  protected repository: MockRepository<Customer>;
  protected entityName = "customer";

  constructor(initialData: Customer[] = []) {
    super();
    this.repository = new MockRepository<Customer>(initialData);
  }
}

export type { Customer };
