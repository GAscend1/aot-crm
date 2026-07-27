"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ReportCategory, ReportStatus } from "../types";

interface ReportFiltersValue {
  category: ReportCategory | "all";
  status: ReportStatus | "all";
}

interface ReportFiltersProps {
  value: ReportFiltersValue;
  onChange: (value: ReportFiltersValue) => void;
  categories: ReportCategory[];
}

export function ReportFilters({
  value,
  onChange,
  categories,
}: ReportFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.category}
        onValueChange={(category) =>
          onChange({ ...value, category: category as ReportCategory | "all" })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as ReportStatus | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Published">Published</SelectItem>
          <SelectItem value="Draft">Draft</SelectItem>
          <SelectItem value="Archived">Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
