"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Check, Copy, Eye, FileText, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader";

import { Quote, quoteStatusColors, quoteStatusLabels } from "./types";

interface ColumnActions {
  onView: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (quote: Quote) => void;
  onDuplicate: (quote: Quote) => void;
  onAccept: (quote: Quote) => void;
  onReject: (quote: Quote) => void;
  onConvert: (quote: Quote) => void;
}

export function createColumns(actions: ColumnActions): ColumnDef<Quote, unknown>[] {
  return [
    {
      accessorKey: "quoteNumber",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quote #" />,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4 text-slate-400" />
          {row.original.quoteNumber}
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
      accessorKey: "opportunity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Opportunity" />,
      cell: ({ row }) => row.original.opportunity || "-",
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-medium", quoteStatusColors[status])}>
            {quoteStatusLabels[status]}
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
      accessorKey: "validUntil",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valid Until" />,
      cell: ({ row }) => row.original.validUntil || "-",
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const quote = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(quote)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(quote)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDuplicate(quote)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {quote.status === "DRAFT" || quote.status === "EXPIRED" ? (
                <DropdownMenuItem onClick={() => actions.onAccept(quote)}>
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  Accept
                </DropdownMenuItem>
              ) : null}
              {(quote.status === "DRAFT" || quote.status === "SENT") && (
                <DropdownMenuItem onClick={() => actions.onReject(quote)}>
                  <X className="mr-2 h-4 w-4 text-red-600" />
                  Reject
                </DropdownMenuItem>
              )}
              {quote.status === "ACCEPTED" && (
                <DropdownMenuItem onClick={() => actions.onConvert(quote)}>
                  <FileText className="mr-2 h-4 w-4 text-blue-600" />
                  Convert to Invoice
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => actions.onDelete(quote)}>
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
