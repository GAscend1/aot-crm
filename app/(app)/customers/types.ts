export type CustomerStatus =
  | "Active"
  | "Inactive"
  | "Prospect"
  | "Blocked";

export interface Customer {
  id: string;

  name: string;

  company: string;

  email: string;

  phone: string;

  position: string;

  country: string;

  city: string;

  status: CustomerStatus;

  tags: string[];

  notes?: string;

  createdAt: string;

  updatedAt: string;
}
