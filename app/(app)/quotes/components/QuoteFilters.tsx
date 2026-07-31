"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteStatus, quoteStatusLabels } from "../types";

const statuses: QuoteStatus[] = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

interface QuoteFiltersProps {
  status: QuoteStatus | "all";
  onStatusChange: (status: QuoteStatus | "all") => void;
}

export function QuoteFilters({ status, onStatusChange }: QuoteFiltersProps) {
  return (
    <Select value={status} onValueChange={(v) => onStatusChange(v as QuoteStatus | "all")}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        {statuses.map((s) => (
          <SelectItem key={s} value={s}>
            {quoteStatusLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
