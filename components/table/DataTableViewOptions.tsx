"use client";

import { Table } from "@tanstack/react-table";
import { Columns3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const columns = table.getAllColumns().filter(
    (col) => typeof col.accessorFn !== "undefined" && col.getCanHide()
  );

  if (columns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <Columns3 className="mr-2 h-4 w-4" />
        Columns
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Base UI requires GroupLabel to be inside a Group/RadioGroup. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={col.getIsVisible()}
            onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
          >
            {typeof col.columnDef.header === "string"
              ? col.columnDef.header
              : col.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
