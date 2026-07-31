import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  country: string;
  city: string;
  notes: string;
  tags: string[];
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export class ContactService extends BaseService<Contact> {
  protected repository: IRepository<Contact>;
  protected entityName = "contact";

  constructor(repository: IRepository<Contact>) {
    super();
    this.repository = repository;
  }
}
