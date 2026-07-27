"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Department, UserStatus } from "../types";
import { AdminFilters } from "./AdminFilters";

interface AdminToolbarProps {
  onAdd: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    role: string;
    department: string;
    status: UserStatus | "all";
  };
  onFilterChange: (filters: {
    role: string;
    department: string;
    status: UserStatus | "all";
  }) => void;
  departments: Department[];
}

export function AdminToolbar({
  onAdd,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  departments,
}: AdminToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search users..."
          className="w-80"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      }
      filters={
        <AdminFilters
          value={filters}
          onChange={onFilterChange}
          departments={departments}
        />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      }
    />
  );
}
