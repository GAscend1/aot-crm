"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CompanyStatus } from "../types";

interface CompanyFiltersValue {
  status: CompanyStatus | "all";
  industry: string;
}

interface CompanyFiltersProps {
  value: CompanyFiltersValue;
  onChange: (value: CompanyFiltersValue) => void;
  industries: string[];
}

export function CompanyFilters({
  value,
  onChange,
  industries,
}: CompanyFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as CompanyStatus | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.industry}
        onValueChange={(industry) =>
          onChange({ ...value, industry })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Industry" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Industries</SelectItem>
          {industries.map((industry) => (
            <SelectItem key={industry} value={industry}>
              {industry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
