"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ReportCategory, ReportStatus } from "../types";
import { ReportFilters } from "./ReportFilters";

interface ReportToolbarProps {
  onAdd: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    category: ReportCategory | "all";
    status: ReportStatus | "all";
  };
  onFilterChange: (filters: {
    category: ReportCategory | "all";
    status: ReportStatus | "all";
  }) => void;
  categories: ReportCategory[];
}

export function ReportToolbar({
  onAdd,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  categories,
}: ReportToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search reports..."
          className="w-80"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      }
      filters={
        <ReportFilters
          value={filters}
          onChange={onFilterChange}
          categories={categories}
        />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Create Report
        </Button>
      }
    />
  );
}
