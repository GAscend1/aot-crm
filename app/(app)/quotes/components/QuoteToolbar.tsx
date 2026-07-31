"use client";

import { Plus } from "lucide-react";
import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuoteStatus } from "../types";
import { QuoteFilters } from "./QuoteFilters";

interface QuoteToolbarProps {
  onAdd: () => void;
  onRefresh?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  status: QuoteStatus | "all";
  onStatusChange: (status: QuoteStatus | "all") => void;
}

export function QuoteToolbar({ onAdd, onRefresh, search, onSearchChange, status, onStatusChange }: QuoteToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input placeholder="Search quotes..." className="w-80" value={search} onChange={(e) => onSearchChange(e.target.value)} />
      }
      filters={<QuoteFilters status={status} onStatusChange={onStatusChange} />}
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quote
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}
