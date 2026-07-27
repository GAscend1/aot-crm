export type ContactStatus = "Active" | "Inactive";

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

  status: ContactStatus;

  createdAt: string;

  updatedAt: string;
}
