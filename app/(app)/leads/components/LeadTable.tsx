"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { leads as initialData } from "../data";
import { Lead, LeadSource, LeadStatus } from "../types";
import { createColumns } from "../columns";
import { LeadDrawer } from "./LeadDrawer";
import { LeadDeleteDialog } from "./LeadDeleteDialog";
import { LeadToolbar } from "./LeadToolbar";

export function LeadTable() {
  const [data, setData] = useState(initialData);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    status: LeadStatus | "all";
    source: LeadSource | "all";
  }>({ status: "all", source: "all" });

  const sourceOptions = useMemo(
    () => [...new Set(data.map((l) => l.source))] as LeadSource[],
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((lead) => {
      const matchesSearch =
        !search ||
        lead.title.toLowerCase().includes(search.toLowerCase()) ||
        lead.company.toLowerCase().includes(search.toLowerCase()) ||
        lead.contactName.toLowerCase().includes(search.toLowerCase()) ||
        lead.owner.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        filters.status === "all" || lead.status === filters.status;
      const matchesSource =
        filters.source === "all" || lead.source === filters.source;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [data, search, filters]);

  function handleAdd() {
    setSelectedLead(null);
    setDrawerOpen(true);
  }

  function handleView(lead: Lead) {
    setSelectedLead(lead);
    setDrawerOpen(true);
  }

  function handleEdit(lead: Lead) {
    setSelectedLead(lead);
    setDrawerOpen(true);
  }

  function handleDelete(lead: Lead) {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  }

  function handleSave(lead: Lead) {
    if (selectedLead) {
      setData((prev) =>
        prev.map((c) => (c.id === selectedLead.id ? lead : c))
      );
    } else {
      setData((prev) => [...prev, lead]);
    }
    setDrawerOpen(false);
    setSelectedLead(null);
  }

  function handleConfirmDelete() {
    if (leadToDelete) {
      setData((prev) => prev.filter((c) => c.id !== leadToDelete.id));
    }
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  }

  const columns = useMemo(
    () => createColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDelete }),
    []
  );

  return (
    <>
      <LeadToolbar
        onAdd={handleAdd}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        sourceOptions={sourceOptions}
      />

      <DataTable
        columns={columns}
        data={filteredData}
      />

      <LeadDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedLead}
        onSave={handleSave}
      />

      <LeadDeleteDialog
        open={deleteDialogOpen}
        lead={leadToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
