"use client";

import { Trash2, Download, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BulkAction } from "@/types/common";

interface DataTableBulkActionsProps<TData> {
  selectedRows: TData[];
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string) => void;
}

export function DataTableBulkActions<TData>({
  selectedRows,
  bulkActions = [],
  onBulkAction,
}: DataTableBulkActionsProps<TData>) {
  if (selectedRows.length === 0 && bulkActions.length === 0) return null;

  const defaultActions: BulkAction[] = [
    { label: "Delete", action: "delete", icon: Trash2, variant: "destructive" },
    { label: "Export", action: "export", icon: Download },
    { label: "Archive", action: "archive", icon: Archive },
  ];

  const actions = bulkActions.length > 0 ? bulkActions : defaultActions;

  return (
    <div className="flex items-center gap-2">
      {selectedRows.length > 0 && (
        <>
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground">{selectedRows.length}</strong> selected
          </span>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.action}
                variant={action.variant === "destructive" ? "destructive" : "outline"}
                size="sm"
                onClick={() => onBulkAction?.(action.action)}
              >
                {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
                {action.label}
              </Button>
            );
          })}
        </>
      )}
    </div>
  );
}
