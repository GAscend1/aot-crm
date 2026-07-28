"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as TanstackTable,
  Row,
} from "@tanstack/react-table";
import { ListRestart } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./DataTablePagination";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { DataTableBulkActions } from "./DataTableBulkActions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { BulkAction } from "@/types/common";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  filterKey?: string;
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string, rows: TData[]) => void;
  toolbar?: React.ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRefresh?: () => void;
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  enableRowSelection = true,
  onRowSelectionChange,
  onRowClick,
  bulkActions,
  onBulkAction,
  toolbar,
  loading,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display yet.",
  onRefresh,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] =
    React.useState<RowSelectionState>({});

  const allColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns;

    return [
      {
        id: "select",
        header: ({ table }: { table: TanstackTable<TData> }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            data-indeterminate={table.getIsSomePageRowsSelected() || undefined}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }: { row: Row<TData> }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      ...columns,
    ] as ColumnDef<TData, TValue>[];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: allColumns,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },

    getRowId: (row) => row.id,

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater(rowSelection)
          : updater;
      setRowSelection(next);

      if (onRowSelectionChange) {
        const selectedRows = table
          ?.getSelectedRowModel()
          ?.rows.map((r) => r.original) ?? [];
        onRowSelectionChange(selectedRows);
      }
    },

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  return (
    <div className="space-y-4">
      {toolbar}

      <div className="flex items-center justify-between gap-4">
        <DataTableBulkActions
          selectedRows={selectedRows}
          bulkActions={bulkActions}
          onBulkAction={(action) => onBulkAction?.(action, selectedRows)}
        />
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh">
              <ListRestart className="h-4 w-4" />
            </Button>
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className="relative overflow-auto rounded-xl border bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white dark:bg-slate-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {allColumns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-32 text-center"
                >
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
