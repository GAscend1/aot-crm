import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

export interface Company {
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
  protected repository: IRepository<Company>;
  protected entityName = "company";

  constructor(repository: IRepository<Company>) {
    super();
    this.repository = repository;
  }
}
