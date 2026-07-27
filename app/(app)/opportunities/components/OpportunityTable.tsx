"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { opportunities as initialData } from "../data";
import { Opportunity, OpportunityStatus, Stage } from "../types";
import { createColumns } from "../columns";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { OpportunityDeleteDialog } from "./OpportunityDeleteDialog";
import { OpportunityToolbar } from "./OpportunityToolbar";

export function OpportunityTable() {
  const [data, setData] = useState(initialData);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] =
    useState<Opportunity | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    stage: Stage | "all";
    status: OpportunityStatus | "all";
  }>({ stage: "all", status: "all" });

  const filteredData = useMemo(() => {
    return data.filter((opportunity) => {
      const matchesSearch =
        !search ||
        opportunity.title.toLowerCase().includes(search.toLowerCase()) ||
        opportunity.customer.toLowerCase().includes(search.toLowerCase()) ||
        opportunity.owner.toLowerCase().includes(search.toLowerCase());
      const matchesStage =
        filters.stage === "all" || opportunity.stage === filters.stage;
      const matchesStatus =
        filters.status === "all" || opportunity.status === filters.status;
      return matchesSearch && matchesStage && matchesStatus;
    });
  }, [data, search, filters]);

  function handleAdd() {
    setSelectedOpportunity(null);
    setDrawerOpen(true);
  }

  function handleView(opportunity: Opportunity) {
    setSelectedOpportunity(opportunity);
    setDrawerOpen(true);
  }

  function handleEdit(opportunity: Opportunity) {
    setSelectedOpportunity(opportunity);
    setDrawerOpen(true);
  }

  function handleDelete(opportunity: Opportunity) {
    setOpportunityToDelete(opportunity);
    setDeleteDialogOpen(true);
  }

  function handleSave(opportunity: Opportunity) {
    if (selectedOpportunity) {
      setData((prev) =>
        prev.map((o) =>
          o.id === selectedOpportunity.id ? opportunity : o
        )
      );
    } else {
      setData((prev) => [...prev, opportunity]);
    }
    setDrawerOpen(false);
    setSelectedOpportunity(null);
  }

  function handleConfirmDelete() {
    if (opportunityToDelete) {
      setData((prev) =>
        prev.filter((o) => o.id !== opportunityToDelete.id)
      );
    }
    setDeleteDialogOpen(false);
    setOpportunityToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setOpportunityToDelete(null);
  }

  const columns = useMemo(
    () =>
      createColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    []
  );

  return (
    <>
      <OpportunityToolbar
        onAdd={handleAdd}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
      />

      <DataTable columns={columns} data={filteredData} />

      <OpportunityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        opportunity={selectedOpportunity}
        onSave={handleSave}
      />

      <OpportunityDeleteDialog
        open={deleteDialogOpen}
        opportunity={opportunityToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
