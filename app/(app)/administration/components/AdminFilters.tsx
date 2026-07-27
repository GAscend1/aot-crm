"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Department, UserStatus } from "../types";

const roles = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "SALES", label: "Sales" },
  { value: "SUPPORT_MANAGER", label: "Support Manager" },
  { value: "SUPPORT", label: "Support" },
  { value: "HR_MANAGER", label: "HR Manager" },
  { value: "HR", label: "HR" },
  { value: "VIEWER", label: "Viewer" },
];

interface AdminFiltersValue {
  role: string;
  department: string;
  status: UserStatus | "all";
}

interface AdminFiltersProps {
  value: AdminFiltersValue;
  onChange: (value: AdminFiltersValue) => void;
  departments: Department[];
}

export function AdminFilters({
  value,
  onChange,
  departments,
}: AdminFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.role}
        onValueChange={(role) =>
          onChange({ ...value, role })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Role" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.department}
        onValueChange={(department) =>
          onChange({ ...value, department })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Department" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as UserStatus | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Inactive">Inactive</SelectItem>
          <SelectItem value="Suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
