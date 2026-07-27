"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { tickets as initialData } from "../data";
import { Ticket, TicketPriority, TicketStatus } from "../types";
import { createColumns } from "../columns";
import { TicketDrawer } from "./TicketDrawer";
import { TicketDeleteDialog } from "./TicketDeleteDialog";
import { TicketToolbar } from "./TicketToolbar";

export function TicketTable() {
  const [data, setData] = useState(initialData);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    priority: TicketPriority | "all";
    status: TicketStatus | "all";
  }>({ priority: "all", status: "all" });

  const filteredData = useMemo(() => {
    return data.filter((ticket) => {
      const matchesSearch =
        !search ||
        ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
        ticket.assignee.toLowerCase().includes(search.toLowerCase()) ||
        ticket.requester.toLowerCase().includes(search.toLowerCase());
      const matchesPriority =
        filters.priority === "all" || ticket.priority === filters.priority;
      const matchesStatus =
        filters.status === "all" || ticket.status === filters.status;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [data, search, filters]);

  function handleAdd() {
    setSelectedTicket(null);
    setDrawerOpen(true);
  }

  function handleView(ticket: Ticket) {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  }

  function handleEdit(ticket: Ticket) {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  }

  function handleDelete(ticket: Ticket) {
    setTicketToDelete(ticket);
    setDeleteDialogOpen(true);
  }

  function handleSave(ticket: Ticket) {
    if (selectedTicket) {
      setData((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? ticket : t))
      );
    } else {
      setData((prev) => [...prev, ticket]);
    }
    setDrawerOpen(false);
    setSelectedTicket(null);
  }

  function handleConfirmDelete() {
    if (ticketToDelete) {
      setData((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
    }
    setDeleteDialogOpen(false);
    setTicketToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setTicketToDelete(null);
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
      <TicketToolbar
        onAdd={handleAdd}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
      />

      <DataTable
        columns={columns}
        data={filteredData}
      />

      <TicketDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        ticket={selectedTicket}
        onSave={handleSave}
      />

      <TicketDeleteDialog
        open={deleteDialogOpen}
        ticket={ticketToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
