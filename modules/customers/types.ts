export interface Customer {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
}