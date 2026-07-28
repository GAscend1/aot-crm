"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DocumentCategory, DocumentStatus } from "../types";
import { DocumentFilters } from "./DocumentFilters";

interface DocumentToolbarProps {
  onAdd: () => void;
  onRefresh?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    status: DocumentStatus | "all";
    category: DocumentCategory | "all";
  };
  onFilterChange: (filters: {
    status: DocumentStatus | "all";
    category: DocumentCategory | "all";
  }) => void;
  categories: DocumentCategory[];
}

export function DocumentToolbar({
  onAdd,
  onRefresh,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  categories,
}: DocumentToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search documents..."
          className="w-80"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      }
      filters={
        <DocumentFilters
          value={filters}
          onChange={onFilterChange}
          categories={categories}
        />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}