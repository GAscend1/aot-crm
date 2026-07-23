"use client";

import { DataTable } from "@/components/table/DataTable";

import { customers } from "../mockData";
import { customerColumns } from "../columns";

export function CustomerTable() {
  return (
    <DataTable
      columns={customerColumns}
      data={customers}
    />
  );
}