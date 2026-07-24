export type CompanyStatus =
  | "Active"
  | "Inactive"
  | "Partner"
  | "Prospect";

export interface Company {
  id: string;

  companyCode: string;

  companyName: string;

  industry: string;

  website: string;

  email: string;

  phone: string;

  country: string;

  city: string;

  employees: number;

  owner: string;

  status: CompanyStatus;

  createdAt: string;

  updatedAt: string;
}