"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader";

import { Report } from "./types";

interface ColumnActions {
  onView: (report: Report) => void;
  onEdit: (report: Report) => void;
  onDelete: (report: Report) => void;
  onRun: (report: Report) => void;
}

const categoryStyles: Record<string, string> = {
  Sales: "bg-blue-100 text-blue-700",
  Customer: "bg-purple-100 text-purple-700",
  Pipeline: "bg-amber-100 text-amber-700",
  Activity: "bg-cyan-100 text-cyan-700",
  Financial: "bg-emerald-100 text-emerald-700",
  Custom: "bg-rose-100 text-rose-700",
};

const statusStyles: Record<string, string> = {
  Published: "bg-green-100 text-green-700",
  Draft: "bg-gray-100 text-gray-700",
  Archived: "bg-orange-100 text-orange-700",
};

export function createColumns(actions: ColumnActions): ColumnDef<Report>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const category = row.original.category;
        return (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-xs font-medium",
              categoryStyles[category] ?? "bg-gray-100 text-gray-700"
            )}
          >
            {category}
          </span>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
    },
    {
      accessorKey: "createdBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
    },
    {
      accessorKey: "lastRun",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Run" />
      ),
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
              statusStyles[status] ?? "bg-gray-100 text-gray-700"
            )}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const report = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(report)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onRun(report)}>
                <Play className="mr-2 h-4 w-4" />
                Run Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(report)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDelete(report)}>
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
