"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader";

import { Contact } from "./types";

export const columns: ColumnDef<Contact>[] = [
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const contact = row.original;
      return `${contact.firstName} ${contact.lastName}`;
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
  },
  {
    accessorKey: "company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
  },
  {
    accessorKey: "position",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Position" />
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
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
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
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
