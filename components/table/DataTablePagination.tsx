"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getSelectedRowModel?.().rows.length ?? 0;

  return (
    <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        {selectedCount > 0 && (
          <p className="text-sm text-muted-foreground">
            <strong>{selectedCount}</strong> of{" "}
            <strong>{table.getFilteredRowModel().rows.length}</strong>{" "}
            row(s) selected.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <strong>{table.getRowModel().rows.length}</strong>{" "}
          of{" "}
          <strong>{table.getFilteredRowModel().rows.length}</strong>{" "}
          records
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Previous
        </Button>

        <span className="text-sm">
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1}
          </strong>{" "}
          of{" "}
          <strong>{table.getPageCount()}</strong>
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}