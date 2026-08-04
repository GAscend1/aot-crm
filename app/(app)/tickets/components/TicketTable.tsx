"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { ticketService } from "@/services/index";
import type { Ticket } from "@/services/ticket.service";
import { TicketModal } from "./TicketModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
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
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | undefined>();

  useEffect(() => {
    ticketService
      .findAll()
      .then((result) => {
        setTickets(result.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tickets.");
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
    setModalOpen(true);
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
        setModalOpen(false);
        setEditingTicket(undefined);
      } catch (err) {
        showError("Error", "Failed to save ticket.");
        throw err;
      }
    },
    [editingTicket, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTicket) return;
    const target = deletingTicket;
    const previous = tickets;
    // Optimistic removal; restored if the API call fails.
    setTickets((prev) => prev.filter((t) => t.id !== target.id));
    setDeleteDialogOpen(false);
    setDeletingTicket(undefined);
    try {
      await ticketService.delete(target.id);
      success("Ticket deleted", `${target.subject} has been removed.`);
    } catch {
      setTickets(previous);
      showError("Error", "Failed to delete ticket.");
    }
  }, [tickets, deletingTicket, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingTicket(undefined);
    setModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ticketService.findAll();
      setTickets(result.data);
    } catch {
      setError("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        onRetry={handleRefresh}
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

      <TicketModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTicket(undefined);
        }}
        ticket={editingTicket ?? null}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingTicket(undefined);
        }}
        title="Delete Ticket"
        message={
          <>
            Are you sure you want to delete <strong>{deletingTicket?.subject}</strong>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
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
