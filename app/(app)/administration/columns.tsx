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

import { User, UserStatus } from "./types";

const statusStyles: Record<UserStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-700",
  Suspended: "bg-red-100 text-red-700",
};

const roleStyles: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  SALES_MANAGER: "bg-amber-100 text-amber-700",
  SALES: "bg-amber-50 text-amber-600",
  SUPPORT_MANAGER: "bg-cyan-100 text-cyan-700",
  SUPPORT: "bg-cyan-50 text-cyan-600",
  HR_MANAGER: "bg-pink-100 text-pink-700",
  HR: "bg-pink-50 text-pink-600",
  VIEWER: "bg-slate-100 text-slate-700",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SALES_MANAGER: "Sales Manager",
  SALES: "Sales",
  SUPPORT_MANAGER: "Support Manager",
  SUPPORT: "Support",
  HR_MANAGER: "HR Manager",
  HR: "HR",
  VIEWER: "Viewer",
};

interface ColumnActions {
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function createColumns(actions: ColumnActions): ColumnDef<User>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-1 text-xs font-medium",
              roleStyles[role]
            )}
          >
            {roleLabels[role]}
          </span>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "team",
      header: "Team",
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
      accessorKey: "lastLogin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Login" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.lastLogin);
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onView(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDelete(user)}>
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
