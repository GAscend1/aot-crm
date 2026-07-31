"use client";

import { Plus } from "lucide-react";
import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoiceStatus } from "../types";
import { InvoiceFilters } from "./InvoiceFilters";

interface InvoiceToolbarProps {
  onAdd: () => void;
  onRefresh?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  status: InvoiceStatus | "all";
  onStatusChange: (status: InvoiceStatus | "all") => void;
}

export function InvoiceToolbar({ onAdd, onRefresh, search, onSearchChange, status, onStatusChange }: InvoiceToolbarProps) {
  return (
    <ModuleToolbar
      search={
        <Input placeholder="Search invoices..." className="w-80" value={search} onChange={(e) => onSearchChange(e.target.value)} />
      }
      filters={<InvoiceFilters status={status} onStatusChange={onStatusChange} />}
      actions={
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      }
      onRefresh={onRefresh}
    />
  );
}
