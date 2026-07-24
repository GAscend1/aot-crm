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
    <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {search}
        {filters}
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}

        {actions}
      </div>
    </div>
  );
}