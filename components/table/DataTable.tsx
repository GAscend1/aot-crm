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
import { DataTableBulkActions } from "./DataTableBulkActions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { BulkAction } from "@/types/common";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  rowLabel?: (row: TData) => string;
  selectedRowId?: string;
  filterKey?: string;
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string, rows: TData[]) => void;
  toolbar?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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
  rowLabel,
  selectedRowId,
  bulkActions,
  onBulkAction,
  toolbar,
  loading,
  error,
  onRetry,
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
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      ...columns,
    ] as ColumnDef<TData, TValue>[];
  }, [columns, enableRowSelection]);

  // TanStack Table's useReactTable returns non-memoizable function references;
  // React Compiler skips memoizing this component, which is expected for this API.
  // eslint-disable-next-line react-hooks/incompatible-library
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
    <div className="space-y-3">
      {toolbar}

      <div className="flex items-center justify-between gap-3">
        <DataTableBulkActions
          selectedRows={selectedRows}
          bulkActions={bulkActions}
          onBulkAction={(action) => onBulkAction?.(action, selectedRows)}
        />
        <div className="flex items-center gap-1.5">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRefresh}
              aria-label="Refresh list"
              title="Refresh"
            >
              <ListRestart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="relative overflow-auto rounded-xl border bg-surface-raised">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-surface-raised">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width:
                        header.getSize() !== 150
                          ? header.getSize()
                          : undefined,
                    }}
                  >
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
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-40 px-4"
                >
                  <ErrorState
                    title="Failed to load"
                    description={error}
                    onRetry={onRetry}
                  />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const isWorkspaceOpen = selectedRowId === row.id;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    data-selected-workspace={isWorkspaceOpen || undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    aria-label={
                      onRowClick
                        ? `${rowLabel?.(row.original) ?? "row"} (open)`
                        : undefined
                    }
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a, button, [data-no-row-click]")) {
                        return;
                      }
                      onRowClick?.(row.original);
                    }}
                    onKeyDown={(e) => {
                      if (!onRowClick) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row.original);
                      }
                    }}
                    className={cn(
                      onRowClick &&
                        "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      isWorkspaceOpen && "bg-primary-soft/60 hover:bg-primary-soft"
                    )}
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
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-40 px-4"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    compact
                  />
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
