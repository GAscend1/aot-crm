"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { OpportunityStatus, Stage } from "../types";

const stages: Stage[] = [
  "Discovery",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const statuses: OpportunityStatus[] = ["Open", "Won", "Lost"];

interface OpportunityFiltersValue {
  stage: Stage | "all";
  status: OpportunityStatus | "all";
}

interface OpportunityFiltersProps {
  value: OpportunityFiltersValue;
  onChange: (value: OpportunityFiltersValue) => void;
}

export function OpportunityFilters({
  value,
  onChange,
}: OpportunityFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.stage}
        onValueChange={(stage) =>
          onChange({ ...value, stage: stage as Stage | "all" })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          {stages.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {stage}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as OpportunityStatus | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
