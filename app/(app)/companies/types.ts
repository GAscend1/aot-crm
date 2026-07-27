export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

export type CompanyStatus = "Active" | "Inactive";

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: CompanySize;
  address: string;
  city: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  employeeCount: number;
  revenue: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}
