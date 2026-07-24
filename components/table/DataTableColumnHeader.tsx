"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Column } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span>{title}</span>;
  }

  return (
    <Button
      variant="ghost"
      className="-ml-3 h-8 px-3"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span>{title}</span>

      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}