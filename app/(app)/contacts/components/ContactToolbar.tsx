"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ContactFilters } from "./ContactFilters";

interface ContactToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
}

export function ContactToolbar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAdd,
  onRefresh,
}: ContactToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search contacts..."
          className="w-80"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      }
      filters={
        <ContactFilters
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}
