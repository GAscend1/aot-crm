"use client";

import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getSelectedRowModel?.().rows.length ?? 0;
  const total = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {selectedCount > 0 && (
          <p>
            <strong className="font-semibold text-foreground">{selectedCount}</strong>{" "}
            of <strong className="font-semibold text-foreground">{total}</strong>{" "}
            selected
          </p>
        )}
        <p>
          Showing{" "}
          <strong className="font-semibold text-foreground">
            {table.getRowModel().rows.length}
          </strong>{" "}
          of{" "}
          <strong className="font-semibold text-foreground">{total}</strong>{" "}
          records
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-7 w-20 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft />
          </Button>
          <span className="px-1 text-sm tabular-nums text-muted-foreground">
            Page{" "}
            <strong className="font-semibold text-foreground">
              {table.getState().pagination.pageIndex + 1}
            </strong>{" "}
            of <strong className="font-semibold text-foreground">{table.getPageCount()}</strong>
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
