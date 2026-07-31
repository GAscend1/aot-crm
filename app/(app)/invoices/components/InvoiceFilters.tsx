"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceStatus, invoiceStatusLabels } from "../types";

const statuses: InvoiceStatus[] = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID"];

interface InvoiceFiltersProps {
  status: InvoiceStatus | "all";
  onStatusChange: (status: InvoiceStatus | "all") => void;
}

export function InvoiceFilters({ status, onStatusChange }: InvoiceFiltersProps) {
  return (
    <Select value={status} onValueChange={(v) => onStatusChange(v as InvoiceStatus | "all")}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        {statuses.map((s) => (
          <SelectItem key={s} value={s}>
            {invoiceStatusLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
