"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMountedRef } from "@/hooks/use-mounted";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { leadService } from "@/services/index";
import type { Lead } from "@/services/lead.service";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LeadModal } from "./LeadModal";
import { LeadToolbar } from "./LeadToolbar";
import { LeadWorkspace } from "./LeadWorkspace";

export function LeadTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | undefined>();

  const mountedRef = useMountedRef();

  useEffect(() => {
    leadService
      .findAll()
      .then((result) => {
        if (!mountedRef.current) return;
        setLeads(result.data);
        setLoading(false);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setError("Failed to load leads.");
        setLoading(false);
      });
  }, [mountedRef]);

  const sourceOptions = useMemo(
    () => [...new Set(leads.map((l) => l.source))],
    [leads],
  );

  const filtered = useMemo(() => {
    let result = leads;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.owner.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (sourceFilter) {
      result = result.filter((l) => l.source === sourceFilter);
    }

    return result;
  }, [leads, searchQuery, statusFilter, sourceFilter]);

  const handleEdit = useCallback((lead: Lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  }, []);

  const handleView = useCallback(
    (lead: Lead) => {
      // Leads is a view inside the Contacts module — navigate directly to the
      // merged workspace so the row click is a single client-side transition.
      router.push(`/contacts?view=leads&record=${encodeURIComponent(lead.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleDelete = useCallback((lead: Lead) => {
    setDeletingLead(lead);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (lead: Lead) => {
      router.push(`/contacts?view=leads&record=${encodeURIComponent(lead.id)}`, {
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
    async (data: Lead) => {
      try {
        if (editingLead) {
          const updated = await leadService.update(editingLead.id, data as Partial<Lead>);
          setLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? updated : l)),
          );
          success("Lead updated", `${updated.title} has been updated.`);
        } else {
          const created = await leadService.create(data as Omit<Lead, "id" | "createdAt" | "updatedAt">);
          setLeads((prev) => [created, ...prev]);
          success("Lead created", `${created.title} has been added.`);
        }
        setModalOpen(false);
        setEditingLead(undefined);
      } catch (err) {
        showError("Error", "Failed to save lead.");
        throw err;
      }
    },
    [editingLead, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingLead) return;
    const target = deletingLead;
    const previous = leads;
    // Optimistic removal; restored if the API call fails.
    setLeads((prev) => prev.filter((l) => l.id !== target.id));
    setDeleteDialogOpen(false);
    setDeletingLead(undefined);
    try {
      await leadService.delete(target.id);
      success("Lead archived", `${target.title} has been archived.`);
    } catch {
      setLeads(previous);
      showError("Error", "Failed to archive lead.");
    }
  }, [leads, deletingLead, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingLead(undefined);
    setModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await leadService.findAll();
      setLeads(result.data);
    } catch {
      setError("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWorkspaceChanged = useCallback(() => {
    leadService.findAll().then((result) => {
      if (mountedRef.current) setLeads(result.data);
    });
  }, [mountedRef]);

  const handleBulkAction = useCallback(
    async (action: string, rows: Lead[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await leadService.delete(row.id);
        }
        setLeads((prev) =>
          prev.filter((l) => !rows.find((r) => r.id === l.id)),
        );
        success("Archived", `${rows.length} lead(s) archived.`);
      } else if (action === "export") {
        const csv = [
          "Title,Company,Contact,Email,Status,Created",
          ...rows.map(
            (r) =>
              `${r.title},${r.company},${r.contactName},${r.email},${r.status},${r.createdAt}`,
          ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "leads.csv";
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
          <LeadToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{
              status: (statusFilter || "all") as Lead["status"] | "all",
              source: (sourceFilter || "all") as Lead["source"] | "all",
            }}
            onFilterChange={({ status, source }) => {
              setStatusFilter(status === "all" ? "" : status);
              setSourceFilter(source === "all" ? "" : source);
            }}
            sourceOptions={sourceOptions}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <LeadModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLead(undefined);
        }}
        lead={editingLead}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingLead(undefined);
        }}
        title="Archive Lead"
        message={
          <>
            Archive <strong>{deletingLead?.title}</strong>? This will remove
            the lead from active lists while keeping any linked records intact.
          </>
        }
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />

      <LeadWorkspace onChanged={handleWorkspaceChanged} />
    </div>
  );
}
