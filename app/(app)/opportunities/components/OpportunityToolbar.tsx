"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { OpportunityStatus, Stage } from "../types";
import { OpportunityFilters } from "./OpportunityFilters";

interface OpportunityToolbarProps {
  onAdd: () => void;
  onRefresh?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    stage: Stage | "all";
    status: OpportunityStatus | "all";
  };
  onFilterChange: (filters: {
    stage: Stage | "all";
    status: OpportunityStatus | "all";
  }) => void;
}

export function OpportunityToolbar({
  onAdd,
  onRefresh,
  search,
  onSearchChange,
  filters,
  onFilterChange,
}: OpportunityToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search opportunities..."
          className="w-80"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      }
      filters={
        <OpportunityFilters value={filters} onChange={onFilterChange} />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Opportunity
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}
