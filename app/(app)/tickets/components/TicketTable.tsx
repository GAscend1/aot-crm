"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { ticketService } from "@/services/index";
import type { Ticket } from "@/services/ticket.service";
import { TicketDrawer } from "./TicketDrawer";
import { TicketDeleteDialog } from "./TicketDeleteDialog";
import { TicketToolbar } from "./TicketToolbar";
import { TicketWorkspace } from "./TicketWorkspace";

export function TicketTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | undefined>();

  useEffect(() => {
    ticketService.findAll().then((result) => {
      setTickets(result.data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = tickets;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          t.requester.toLowerCase().includes(q),
      );
    }

    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }

    return result;
  }, [tickets, searchQuery, priorityFilter, statusFilter]);

  const handleEdit = useCallback((ticket: Ticket) => {
    setEditingTicket(ticket);
    setDrawerOpen(true);
  }, []);

  const handleView = useCallback(
    (ticket: Ticket) => {
      router.push(`/tickets?record=${encodeURIComponent(ticket.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleDelete = useCallback((ticket: Ticket) => {
    setDeletingTicket(ticket);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (ticket: Ticket) => {
      router.push(`/tickets?record=${encodeURIComponent(ticket.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const columns = useMemo(
    () => createColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDelete }),
    [handleView, handleEdit, handleDelete],
  );

  const handleSave = useCallback(
    async (data: Ticket) => {
      try {
        if (editingTicket) {
          const updated = await ticketService.update(editingTicket.id, data as Partial<Ticket>);
          setTickets((prev) =>
            prev.map((t) => (t.id === editingTicket.id ? updated : t)),
          );
          success("Ticket updated", `${updated.subject} has been updated.`);
        } else {
          const created = await ticketService.create(data as Omit<Ticket, "id" | "createdAt" | "updatedAt">);
          setTickets((prev) => [created, ...prev]);
          success("Ticket created", `${created.subject} has been added.`);
        }
        setDrawerOpen(false);
        setEditingTicket(undefined);
      } catch {
        showError("Error", "Failed to save ticket.");
      }
    },
    [editingTicket, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingTicket) {
      try {
        await ticketService.delete(deletingTicket.id);
        setTickets((prev) =>
          prev.filter((t) => t.id !== deletingTicket.id),
        );
        success("Ticket deleted", `${deletingTicket.subject} has been removed.`);
        setDeletingTicket(undefined);
      } catch {
        showError("Error", "Failed to delete ticket.");
      }
    }
  }, [deletingTicket, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingTicket(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await ticketService.findAll();
    setTickets(result.data);
    setLoading(false);
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Ticket[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await ticketService.delete(row.id);
        }
        setTickets((prev) =>
          prev.filter((t) => !rows.find((r) => r.id === t.id)),
        );
        success("Deleted", `${rows.length} ticket(s) deleted.`);
      } else if (action === "export") {
        const csv = [
          "Subject,Priority,Status,Assignee,Requester,Created",
          ...rows.map(
            (r) =>
              `${r.subject},${r.priority},${r.status},${r.assignee},${r.requester},${r.createdAt}`,
          ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tickets.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [success],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filtered}
        enableRowSelection={true}
        onRowClick={handleRowClick}
        onBulkAction={handleBulkAction}
        toolbar={
          <TicketToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{
              priority: (priorityFilter || "all") as Ticket["priority"] | "all",
              status: (statusFilter || "all") as Ticket["status"] | "all",
            }}
            onFilterChange={({ priority, status }) => {
              setPriorityFilter(priority === "all" ? "" : priority);
              setStatusFilter(status === "all" ? "" : status);
            }}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <TicketDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingTicket(undefined);
        }}
        ticket={editingTicket ?? null}
        onSave={handleSave}
      />

      <TicketDeleteDialog
        open={deleteDialogOpen}
        ticket={deletingTicket ?? null}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingTicket(undefined);
        }}
      />

      <TicketWorkspace
        onChanged={() => {
          ticketService.findAll().then((result) => {
            setTickets(result.data);
          });
        }}
      />
    </div>
  );
}
