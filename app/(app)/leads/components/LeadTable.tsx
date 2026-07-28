"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { leadService } from "@/services/index";
import type { Lead } from "@/services/lead.service";
import { LeadDrawer } from "./LeadDrawer";
import { LeadDeleteDialog } from "./LeadDeleteDialog";
import { LeadToolbar } from "./LeadToolbar";

export function LeadTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | undefined>();

  useEffect(() => {
    leadService.findAll().then((result) => {
      setLeads(result.data);
      setLoading(false);
    });
  }, []);

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
    setDrawerOpen(true);
  }, []);

  const handleView = useCallback(
    (lead: Lead) => {
      router.push(`/leads/${lead.id}`);
    },
    [router],
  );

  const handleDelete = useCallback((lead: Lead) => {
    setDeletingLead(lead);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (lead: Lead) => {
      router.push(`/leads/${lead.id}`);
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
        setDrawerOpen(false);
        setEditingLead(undefined);
      } catch {
        showError("Error", "Failed to save lead.");
      }
    },
    [editingLead, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingLead) {
      try {
        await leadService.delete(deletingLead.id);
        setLeads((prev) =>
          prev.filter((l) => l.id !== deletingLead.id),
        );
        success("Lead deleted", `${deletingLead.title} has been removed.`);
        setDeletingLead(undefined);
      } catch {
        showError("Error", "Failed to delete lead.");
      }
    }
  }, [deletingLead, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingLead(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await leadService.findAll();
    setLeads(result.data);
    setLoading(false);
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Lead[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await leadService.delete(row.id);
        }
        setLeads((prev) =>
          prev.filter((l) => !rows.find((r) => r.id === l.id)),
        );
        success("Deleted", `${rows.length} lead(s) deleted.`);
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

      <LeadDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingLead(undefined);
        }}
        lead={editingLead ?? null}
        onSave={handleSave}
      />

      <LeadDeleteDialog
        open={deleteDialogOpen}
        lead={deletingLead ?? null}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingLead(undefined);
        }}
      />
    </div>
  );
}
