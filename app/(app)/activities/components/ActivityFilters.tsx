"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ActivityStatus, ActivityType } from "../types";

interface ActivityFiltersValue {
  type: ActivityType | "all";
  status: ActivityStatus | "all";
}

interface ActivityFiltersProps {
  value: ActivityFiltersValue;
  onChange: (value: ActivityFiltersValue) => void;
}

const types: ActivityType[] = [
  "Meeting",
  "Call",
  "Email",
  "Task",
  "Reminder",
];

const statuses: ActivityStatus[] = [
  "Planned",
  "In Progress",
  "Completed",
  "Cancelled",
];

export function ActivityFilters({
  value,
  onChange,
}: ActivityFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.type}
        onValueChange={(type) =>
          onChange({ ...value, type: type as ActivityType | "all" })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Type" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {types.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as ActivityStatus | "all" })
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
