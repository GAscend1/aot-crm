"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { opportunityService } from "@/services/index";
import type { Opportunity } from "@/services/opportunity.service";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { OpportunityModal } from "./OpportunityModal";
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
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOpportunity, setDeletingOpportunity] = useState<Opportunity | undefined>();

  useEffect(() => {
    opportunityService
      .findAll()
      .then((result) => {
        setOpportunities(result.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load opportunities.");
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
    setModalOpen(true);
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
        setModalOpen(false);
        setEditingOpportunity(undefined);
      } catch (err) {
        showError("Error", "Failed to save opportunity.");
        throw err;
      }
    },
    [editingOpportunity, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingOpportunity) return;
    const target = deletingOpportunity;
    const previous = opportunities;
    // Optimistic removal; restored if the API call fails.
    setOpportunities((prev) => prev.filter((o) => o.id !== target.id));
    setDeleteDialogOpen(false);
    setDeletingOpportunity(undefined);
    try {
      await opportunityService.delete(target.id);
      success("Opportunity archived", `${target.title} has been archived.`);
    } catch {
      setOpportunities(previous);
      showError("Error", "Failed to archive opportunity.");
    }
  }, [opportunities, deletingOpportunity, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingOpportunity(undefined);
    setModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await opportunityService.findAll();
      setOpportunities(result.data);
    } catch {
      setError("Failed to load opportunities.");
    } finally {
      setLoading(false);
    }
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
        success("Archived", `${rows.length} opportunity(ies) archived.`);
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

      <OpportunityModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingOpportunity(undefined);
        }}
        opportunity={editingOpportunity}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingOpportunity(undefined);
        }}
        title="Archive Opportunity"
        message={
          <>
            Archive <strong>{deletingOpportunity?.title}</strong>? This will remove
            the opportunity from the pipeline while keeping related records intact.
          </>
        }
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleConfirmDelete}
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
