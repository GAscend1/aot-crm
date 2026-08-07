"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PipelineFilters {
  search: string;
  owner: string;
  priority: string;
  minValue: string;
  maxValue: string;
}

interface PipelineFiltersBarProps {
  filters: PipelineFilters;
  onChange: (filters: PipelineFilters) => void;
  /** Available owner names for the dropdown. */
  owners: string[];
}

export function PipelineFiltersBar({
  filters,
  onChange,
  owners,
}: PipelineFiltersBarProps) {
  const update = (patch: Partial<PipelineFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const hasFilters =
    filters.search || filters.owner !== "all" || filters.priority !== "all" ||
    filters.minValue || filters.maxValue;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1 md:min-w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search opportunities..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <Select
        value={filters.owner}
        onValueChange={(v) => update({ owner: v })}
      >
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Owners</SelectItem>
          {owners.map((owner) => (
            <SelectItem key={owner} value={owner}>
              {owner}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) => update({ priority: v })}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          placeholder="Min $"
          value={filters.minValue}
          onChange={(e) => update({ minValue: e.target.value })}
          className="h-8 w-[80px] text-xs"
          type="number"
          min={0}
        />
        <span className="text-xs text-muted-foreground">-</span>
        <Input
          placeholder="Max $"
          value={filters.maxValue}
          onChange={(e) => update({ maxValue: e.target.value })}
          className="h-8 w-[80px] text-xs"
          type="number"
          min={0}
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              search: "",
              owner: "all",
              priority: "all",
              minValue: "",
              maxValue: "",
            })
          }
          className="h-8 px-2 text-xs"
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}