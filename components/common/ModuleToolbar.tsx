"use client";

import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ModuleToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
}

export function ModuleToolbar({
  search,
  filters,
  actions,
  onRefresh,
}: ModuleToolbarProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-surface-raised px-3 py-2.5 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {search}
        {filters}
      </div>

      <div className="flex items-center gap-1.5">
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}

        {actions}
      </div>
    </div>
  );
}
