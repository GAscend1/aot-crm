"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader";

import { Invoice, invoiceStatusColors, invoiceStatusLabels } from "./types";

interface ColumnActions {
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onVoid: (invoice: Invoice) => void;
}

export function createColumns(actions: ColumnActions): ColumnDef<Invoice, unknown>[] {
  return [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4 text-slate-400" />
          {row.original.invoiceNumber}
        </span>
      ),
    },
    {
      accessorKey: "customer",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    },
    {
      accessorKey: "company",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
    },
    {
      accessorKey: "quote",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quote" />,
      cell: ({ row }) => row.original.quote || "-",
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-medium", invoiceStatusColors[status])}>
            {invoiceStatusLabels[status]}
          </span>
        );
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />,
      cell: ({ row }) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: row.original.currency || "USD", maximumFractionDigits: 0 }).format(
          row.original.total
        ),
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ row }) => row.original.dueDate || "-",
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(invoice)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(invoice)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {invoice.status !== "PAID" && invoice.status !== "VOID" && (
                <DropdownMenuItem onClick={() => actions.onMarkPaid(invoice)}>
                  <FileText className="mr-2 h-4 w-4 text-green-600" />
                  Mark Paid
                </DropdownMenuItem>
              )}
              {invoice.status !== "VOID" && (
                <DropdownMenuItem onClick={() => actions.onVoid(invoice)}>
                  <FileText className="mr-2 h-4 w-4 text-red-600" />
                  Void
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => actions.onDelete(invoice)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
