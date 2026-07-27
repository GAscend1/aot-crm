"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { companies as initialData } from "../data";
import { Company, CompanyStatus } from "../types";
import { createColumns } from "../columns";
import { CompanyDrawer } from "./CompanyDrawer";
import { CompanyDeleteDialog } from "./CompanyDeleteDialog";
import { CompanyToolbar } from "./CompanyToolbar";

export function CompanyTable() {
  const [data, setData] = useState(initialData);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    status: CompanyStatus | "all";
    industry: string;
  }>({ status: "all", industry: "all" });

  const industries = useMemo(
    () => [...new Set(data.map((c) => c.industry))],
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((company) => {
      const matchesSearch =
        !search ||
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.city.toLowerCase().includes(search.toLowerCase()) ||
        company.industry.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        filters.status === "all" || company.status === filters.status;
      const matchesIndustry =
        filters.industry === "all" || company.industry === filters.industry;
      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [data, search, filters]);

  function handleAdd() {
    setSelectedCompany(null);
    setDrawerOpen(true);
  }

  function handleView(company: Company) {
    setSelectedCompany(company);
    setDrawerOpen(true);
  }

  function handleEdit(company: Company) {
    setSelectedCompany(company);
    setDrawerOpen(true);
  }

  function handleDelete(company: Company) {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  }

  function handleSave(company: Company) {
    if (selectedCompany) {
      setData((prev) =>
        prev.map((c) => (c.id === selectedCompany.id ? company : c))
      );
    } else {
      setData((prev) => [...prev, company]);
    }
    setDrawerOpen(false);
    setSelectedCompany(null);
  }

  function handleConfirmDelete() {
    if (companyToDelete) {
      setData((prev) => prev.filter((c) => c.id !== companyToDelete.id));
    }
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  }

  const columns = useMemo(
    () => createColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDelete }),
    []
  );

  return (
    <>
      <CompanyToolbar
        onAdd={handleAdd}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        industries={industries}
      />

      <DataTable
        columns={columns}
        data={filteredData}
      />

      <CompanyDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        company={selectedCompany}
        onSave={handleSave}
      />

      <CompanyDeleteDialog
        open={deleteDialogOpen}
        company={companyToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
