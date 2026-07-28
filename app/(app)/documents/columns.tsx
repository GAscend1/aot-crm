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

import { Document, DocumentCategory } from "./types";

interface ColumnActions {
  onView: (document: Document) => void;
  onEdit: (document: Document) => void;
  onDelete: (document: Document) => void;
}

const categoryColors: Record<DocumentCategory, string> = {
  Contract: "bg-blue-100 text-blue-700",
  Proposal: "bg-purple-100 text-purple-700",
  Report: "bg-amber-100 text-amber-700",
  Invoice: "bg-emerald-100 text-emerald-700",
  Marketing: "bg-pink-100 text-pink-700",
  Other: "bg-gray-100 text-gray-700",
};

export function createColumns(actions: ColumnActions): ColumnDef<Document, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
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
              categoryColors[category]
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
      accessorKey: "size",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
    },
    {
      accessorKey: "uploadedBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Uploaded By" />
      ),
    },
    {
      accessorKey: "uploadDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Upload Date" />
      ),
    },
    {
      accessorKey: "version",
      header: "Version",
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
              status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
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
        const document = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(document)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(document)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDelete(document)}>
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