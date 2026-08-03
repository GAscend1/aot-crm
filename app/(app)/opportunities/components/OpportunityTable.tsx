"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { opportunityService } from "@/services/index";
import type { Opportunity } from "@/services/opportunity.service";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { OpportunityDeleteDialog } from "./OpportunityDeleteDialog";
import { OpportunityToolbar } from "./OpportunityToolbar";
import { OpportunityWorkspace } from "./OpportunityWorkspace";

export function OpportunityTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToastContext();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOpportunity, setDeletingOpportunity] = useState<Opportunity | undefined>();

  useEffect(() => {
    opportunityService.findAll().then((result) => {
      setOpportunities(result.data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = opportunities;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.owner.toLowerCase().includes(q),
      );
    }

    if (stageFilter) {
      result = result.filter((o) => o.stage === stageFilter);
    }

    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }

    return result;
  }, [opportunities, searchQuery, stageFilter, statusFilter]);

  const handleEdit = useCallback((opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setDrawerOpen(true);
  }, []);

  const handleView = useCallback(
    (opportunity: Opportunity) => {
      router.push(`/opportunities?record=${encodeURIComponent(opportunity.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleDelete = useCallback((opportunity: Opportunity) => {
    setDeletingOpportunity(opportunity);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (opportunity: Opportunity) => {
      router.push(`/opportunities?record=${encodeURIComponent(opportunity.id)}`, {
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
    async (data: Opportunity) => {
      try {
        if (editingOpportunity) {
          const updated = await opportunityService.update(editingOpportunity.id, data as Partial<Opportunity>);
          setOpportunities((prev) =>
            prev.map((o) => (o.id === editingOpportunity.id ? updated : o)),
          );
          success("Opportunity updated", `${updated.title} has been updated.`);
        } else {
          const created = await opportunityService.create(data as Omit<Opportunity, "id" | "createdAt" | "updatedAt">);
          setOpportunities((prev) => [created, ...prev]);
          success("Opportunity created", `${created.title} has been added.`);
        }
        setDrawerOpen(false);
        setEditingOpportunity(undefined);
      } catch {
        showError("Error", "Failed to save opportunity.");
      }
    },
    [editingOpportunity, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingOpportunity) {
      try {
        await opportunityService.delete(deletingOpportunity.id);
        setOpportunities((prev) =>
          prev.filter((o) => o.id !== deletingOpportunity.id),
        );
        success("Opportunity deleted", `${deletingOpportunity.title} has been removed.`);
        setDeletingOpportunity(undefined);
      } catch {
        showError("Error", "Failed to delete opportunity.");
      }
    }
  }, [deletingOpportunity, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingOpportunity(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await opportunityService.findAll();
    setOpportunities(result.data);
    setLoading(false);
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Opportunity[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await opportunityService.delete(row.id);
        }
        setOpportunities((prev) =>
          prev.filter((o) => !rows.find((r) => r.id === o.id)),
        );
        success("Deleted", `${rows.length} opportunity(ies) deleted.`);
      } else if (action === "export") {
        const csv = [
          "Title,Customer,Value,Stage,Status,Created",
          ...rows.map(
            (r) =>
              `${r.title},${r.customer},${r.value},${r.stage},${r.status},${r.createdAt}`,
          ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "opportunities.csv";
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
          <OpportunityToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{
              stage: (stageFilter || "all") as Opportunity["stage"] | "all",
              status: (statusFilter || "all") as Opportunity["status"] | "all",
            }}
            onFilterChange={({ stage, status }) => {
              setStageFilter(stage === "all" ? "" : stage);
              setStatusFilter(status === "all" ? "" : status);
            }}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <OpportunityDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingOpportunity(undefined);
        }}
        opportunity={editingOpportunity ?? null}
        onSave={handleSave}
      />

      <OpportunityDeleteDialog
        open={deleteDialogOpen}
        opportunity={deletingOpportunity ?? null}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingOpportunity(undefined);
        }}
      />

      <OpportunityWorkspace
        key={searchParams?.get("record") ? `record:${searchParams.get("record")}` : "closed"}
        siblings={filtered.map((o) => ({ id: o.id, title: o.title }))}
        onChanged={() => {
          opportunityService.findAll().then((result) => {
            setOpportunities(result.data);
          });
        }}
      />
    </div>
  );
}
