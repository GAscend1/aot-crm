import { BaseService } from "./base/BaseService";
import { MockRepository } from "@/repositories/mock/MockRepository";

interface Company {
  id: string;
  name: string;
  industry: string;
  size: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  address: string;
  city: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  employeeCount: number;
  revenue: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export class CompanyService extends BaseService<Company> {
  protected repository: MockRepository<Company>;
  protected entityName = "company";

  constructor(initialData: Company[] = []) {
    super();
    this.repository = new MockRepository<Company>(initialData);
  }
}

export type { Company };
