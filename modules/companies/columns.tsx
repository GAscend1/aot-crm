import { ColumnDef } from "@tanstack/react-table";

import { Company } from "./types";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader";

export const companyColumns: ColumnDef<Company>[] = [
  {
    accessorKey: "companyName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
  },
  {
    accessorKey: "industry",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Industry" />
    ),
  },
  {
    accessorKey: "website",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Website" />
    ),
  },
  {
    accessorKey: "country",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Country" />
    ),
  },
  {
    accessorKey: "employeeCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Employees" />
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
              : "bg-red-100 text-red-700"
          }`}
        >
          {status}
        </span>
      );
    },
  },
];