export interface Company {
  id: number;

  companyName: string;

  industry: string;

  website: string;

  email: string;

  phone: string;

  country: string;

  city: string;

  address: string;

  employeeCount: number;

  status: "Active" | "Inactive";

  createdAt: string;
}