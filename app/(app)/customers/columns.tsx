"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Customer } from "./types";

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "customerCode",
    header: "Customer ID",
  },
  {
    accessorKey: "firstName",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>

        <div className="text-xs text-muted-foreground">
          {row.original.position}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "company",
    header: "Company",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      const styles = {
        Active:
          "bg-green-100 text-green-700",
        Prospect:
          "bg-blue-100 text-blue-700",
        Inactive:
          "bg-slate-100 text-slate-700",
        Blocked:
          "bg-red-100 text-red-700",
      };

      return (
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    enableSorting: false,
    cell: () => (
      <Button
        variant="ghost"
        size="icon"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    ),
  },
];