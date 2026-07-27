"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DocumentCategory, DocumentStatus } from "../types";

interface DocumentFiltersValue {
  status: DocumentStatus | "all";
  category: DocumentCategory | "all";
}

interface DocumentFiltersProps {
  value: DocumentFiltersValue;
  onChange: (value: DocumentFiltersValue) => void;
  categories: DocumentCategory[];
}

const statuses: (DocumentStatus | "all")[] = ["all", "Active", "Archived"];

export function DocumentFilters({
  value,
  onChange,
  categories,
}: DocumentFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.category}
        onValueChange={(category) =>
          onChange({ ...value, category: category as DocumentCategory | "all" })
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
          onChange({ ...value, status: status as DocumentStatus | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status === "all" ? "All Status" : status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}