"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CompanyStatus } from "../types";
import { CompanyFilters } from "./CompanyFilters";

interface CompanyToolbarProps {
  onAdd: () => void;
  onRefresh?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    status: CompanyStatus | "all";
    industry: string;
  };
  onFilterChange: (filters: {
    status: CompanyStatus | "all";
    industry: string;
  }) => void;
  industries: string[];
}

export function CompanyToolbar({
  onAdd,
  onRefresh,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  industries,
}: CompanyToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search companies..."
          className="w-80"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      }
      filters={
        <CompanyFilters
          value={filters}
          onChange={onFilterChange}
          industries={industries}
        />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}
