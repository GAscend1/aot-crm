"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { LeadSource, LeadStatus } from "../types";
import { LeadFilters } from "./LeadFilters";

interface LeadToolbarProps {
  onAdd: () => void;
  onRefresh?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    status: LeadStatus | "all";
    source: LeadSource | "all";
  };
  onFilterChange: (filters: {
    status: LeadStatus | "all";
    source: LeadSource | "all";
  }) => void;
  sourceOptions: LeadSource[];
}

export function LeadToolbar({
  onAdd,
  onRefresh,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  sourceOptions,
}: LeadToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search leads..."
          className="w-80"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      }
      filters={
        <LeadFilters
          value={filters}
          onChange={onFilterChange}
          sourceOptions={sourceOptions}
        />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}
