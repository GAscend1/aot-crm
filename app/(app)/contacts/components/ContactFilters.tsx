"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactFiltersProps {
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
}

export function ContactFilters({
  statusFilter,
  onStatusFilterChange,
}: ContactFiltersProps) {
  return (
    <Select
      value={statusFilter || "all"}
      onValueChange={(value) =>
        onStatusFilterChange?.(value === "all" ? "" : value)
      }
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder="All Statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="Active">Active</SelectItem>
        <SelectItem value="Inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
  );
}
