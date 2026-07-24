"use client";

import { DataTable } from "@/components/table/DataTable";

import { columns } from "../columns";
import { customers } from "../data";

export function CustomerTable() {
  return (
    <DataTable
      columns={columns}
      data={customers}
    />
  );
}