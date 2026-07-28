import { BaseService } from "./base/BaseService";
import { MockRepository } from "@/repositories/mock/MockRepository";

interface Contact {
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
  protected repository: MockRepository<Contact>;

  constructor(initialData: Contact[] = []) {
    super();
    this.repository = new MockRepository<Contact>(initialData);
  }
}

export type { Contact };
