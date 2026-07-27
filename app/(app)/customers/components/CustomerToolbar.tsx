"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CustomerFilters } from "./CustomerFilters";

interface CustomerToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
}

export function CustomerToolbar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAdd,
  onRefresh,
}: CustomerToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search customers..."
          className="w-80"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      }
      filters={
        <CustomerFilters
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}
