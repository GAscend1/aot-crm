import { UserRole } from "@/config/roles";

export type Department = "Sales" | "Support" | "HR" | "Engineering" | "Marketing" | "Finance";

export type Team = "Alpha" | "Beta" | "Gamma" | "Delta" | "Epsilon";

export type UserStatus = "Active" | "Inactive" | "Suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  team: Team;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}
