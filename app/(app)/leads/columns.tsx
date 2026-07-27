"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader";

import { Lead, LeadStatus } from "./types";

const statusStyles: Record<LeadStatus, string> = {
  "New": "bg-blue-100 text-blue-700",
  "Contacted": "bg-yellow-100 text-yellow-700",
  "Qualified": "bg-indigo-100 text-indigo-700",
  "Proposal": "bg-purple-100 text-purple-700",
  "Negotiation": "bg-orange-100 text-orange-700",
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface ColumnActions {
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export function createColumns(actions: ColumnActions): ColumnDef<Lead>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
    },
    {
      accessorKey: "company",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
    },
    {
      accessorKey: "owner",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Owner" />
      ),
    },
    {
      accessorKey: "score",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Score" />
      ),
      cell: ({ row }) => {
        const score = row.original.score;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-gray-200">
              <div
                className={cn(
                  "h-2 rounded-full",
                  score >= 80
                    ? "bg-green-500"
                    : score >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                )}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-xs font-medium">{score}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "expectedRevenue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expected Revenue" />
      ),
      cell: ({ row }) => formatCurrency(row.original.expectedRevenue),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-xs font-medium",
              statusStyles[status]
            )}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(lead)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(lead)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDelete(lead)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
