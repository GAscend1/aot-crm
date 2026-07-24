export type CustomerStatus =
  | "Active"
  | "Inactive"
  | "Prospect"
  | "Blocked";

export interface Customer {
  id: string;

  customerCode: string;

  firstName: string;

  lastName: string;

  company: string;

  position: string;

  email: string;

  phone: string;

  country: string;

  city: string;

  owner: string;

  status: CustomerStatus;

  createdAt: string;

  updatedAt: string;
}