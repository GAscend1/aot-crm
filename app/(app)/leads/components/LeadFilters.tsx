"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { LeadSource, LeadStatus } from "../types";

interface LeadFiltersValue {
  status: LeadStatus | "all";
  source: LeadSource | "all";
}

interface LeadFiltersProps {
  value: LeadFiltersValue;
  onChange: (value: LeadFiltersValue) => void;
  sourceOptions: LeadSource[];
}

const statusOptions: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

export function LeadFilters({
  value,
  onChange,
  sourceOptions,
}: LeadFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as LeadStatus | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {statusOptions.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.source}
        onValueChange={(source) =>
          onChange({ ...value, source: source as LeadSource | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Source" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {sourceOptions.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
