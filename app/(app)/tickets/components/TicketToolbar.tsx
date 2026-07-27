"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { TicketPriority, TicketStatus } from "../types";
import { TicketFilters } from "./TicketFilters";

interface TicketToolbarProps {
  onAdd: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    priority: TicketPriority | "all";
    status: TicketStatus | "all";
  };
  onFilterChange: (filters: {
    priority: TicketPriority | "all";
    status: TicketStatus | "all";
  }) => void;
}

export function TicketToolbar({
  onAdd,
  search,
  onSearchChange,
  filters,
  onFilterChange,
}: TicketToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search tickets..."
          className="w-80"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      }
      filters={
        <TicketFilters
          value={filters}
          onChange={onFilterChange}
        />
      }
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ticket
        </Button>
      }
    />
  );
}
