"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ActivityStatus, ActivityType } from "../types";
import { ActivityFilters } from "./ActivityFilters";

interface ActivityToolbarProps {
  onAdd: () => void;
  onRefresh?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    type: ActivityType | "all";
    status: ActivityStatus | "all";
  };
  onFilterChange: (filters: {
    type: ActivityType | "all";
    status: ActivityStatus | "all";
  }) => void;
}

export function ActivityToolbar({
  onAdd,
  onRefresh,
  search,
  onSearchChange,
  filters,
  onFilterChange,
}: ActivityToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search activities..."
          className="w-80"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      }
      filters={
        <ActivityFilters value={filters} onChange={onFilterChange} />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}
