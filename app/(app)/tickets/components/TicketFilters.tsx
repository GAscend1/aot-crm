"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TicketPriority, TicketStatus } from "../types";

interface TicketFiltersValue {
  priority: TicketPriority | "all";
  status: TicketStatus | "all";
}

interface TicketFiltersProps {
  value: TicketFiltersValue;
  onChange: (value: TicketFiltersValue) => void;
}

export function TicketFilters({
  value,
  onChange,
}: TicketFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.priority}
        onValueChange={(priority) =>
          onChange({ ...value, priority: priority as TicketPriority | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="Critical">Critical</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as TicketStatus | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Open">Open</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Resolved">Resolved</SelectItem>
          <SelectItem value="Closed">Closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
