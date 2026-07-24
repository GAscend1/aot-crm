"use client";

import { DataTable } from "@/components/table/DataTable";

import { columns } from "../columns";
import { companies } from "../data";

export function CompanyTable() {
  return (
    <DataTable
      columns={columns}
      data={companies}
    />
  );
}