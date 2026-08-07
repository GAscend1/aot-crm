"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMountedRef } from "@/hooks/use-mounted";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { activityService } from "@/services/index";
import type { Activity } from "@/services/activity.service";
import { ActivityModal } from "./ActivityModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ActivityToolbar } from "./ActivityToolbar";
import { ActivityWorkspace } from "./ActivityWorkspace";

export function ActivityTable({
  defaultTypeFilter,
}: {
  /** Pre-set the type filter (used by the Tasks view). */
  defaultTypeFilter?: string;
}) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(defaultTypeFilter ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Activity | undefined>();

  const mountedRef = useMountedRef();

  useEffect(() => {
    activityService
      .findAll()
      .then((result) => {
        if (!mountedRef.current) return;
        setActivities(result.data);
        setLoading(false);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setError("Failed to load activities.");
        setLoading(false);
      });
  }, [mountedRef]);

  const filtered = useMemo(() => {
    let result = activities;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.subject.toLowerCase().includes(q) ||
          a.owner.toLowerCase().includes(q) ||
          a.relatedTo.toLowerCase().includes(q),
      );
    }

    if (typeFilter) {
      result = result.filter((a) => a.type === typeFilter);
    }

    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }

    return result;
  }, [activities, searchQuery, typeFilter, statusFilter]);

  const handleEdit = useCallback((activity: Activity) => {
    setEditingActivity(activity);
    setModalOpen(true);
  }, []);

  const handleView = useCallback(
    (activity: Activity) => {
      router.push(`/activities?record=${encodeURIComponent(activity.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleDelete = useCallback((activity: Activity) => {
    setDeletingActivity(activity);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (activity: Activity) => {
      router.push(`/activities?record=${encodeURIComponent(activity.id)}`, {
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
    async (data: Activity) => {
      // Map the UI form shape onto the API schema. The API maps these onto
      // Prisma fields (dueDate, assignee, relations) — the raw UI shape
      // (date/time/owner/relatedTo) cannot be persisted directly.
      const payload = {
        type: data.type,
        subject: data.subject,
        description: data.description || undefined,
        status: data.status,
        dueDate: data.date && data.time ? `${data.date}T${data.time}:00` : data.date || null,
      };
      try {
        if (editingActivity) {
          const res = await fetch(`/api/activities/${editingActivity.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Failed");
          const updated = (await res.json()) as Activity;
          setActivities((prev) =>
            prev.map((a) => (a.id === editingActivity.id ? updated : a)),
          );
          success("Activity updated", `${updated.subject} has been updated.`);
        } else {
          const res = await fetch("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error("Failed");
          const created = (await res.json()) as Activity;
          setActivities((prev) => [created, ...prev]);
          success("Activity created", `${created.subject} has been added.`);
        }
        setModalOpen(false);
        setEditingActivity(undefined);
      } catch (err) {
        showError("Error", "Failed to save activity.");
        throw err;
      }
    },
    [editingActivity, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingActivity) return;
    const target = deletingActivity;
    const previous = activities;
    // Optimistic removal; restored if the API call fails.
    setActivities((prev) => prev.filter((a) => a.id !== target.id));
    setDeleteDialogOpen(false);
    setDeletingActivity(undefined);
    try {
      await activityService.delete(target.id);
      success("Activity deleted", `${target.subject} has been removed.`);
    } catch {
      setActivities(previous);
      showError("Error", "Failed to delete activity.");
    }
  }, [activities, deletingActivity, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingActivity(undefined);
    setModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await activityService.findAll();
      setActivities(result.data);
    } catch {
      setError("Failed to load activities.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Activity[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await activityService.delete(row.id);
        }
        setActivities((prev) =>
          prev.filter((a) => !rows.find((r) => r.id === a.id)),
        );
        success("Deleted", `${rows.length} activity(ies) deleted.`);
      } else if (action === "export") {
        const csv = [
          "Type,Subject,Date,Owner,Status,Created",
          ...rows.map(
            (r) =>
              `${r.type},${r.subject},${r.date},${r.owner},${r.status},${r.createdAt}`,
          ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "activities.csv";
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
          <ActivityToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{
              type: (typeFilter || "all") as Activity["type"] | "all",
              status: (statusFilter || "all") as Activity["status"] | "all",
            }}
            onFilterChange={({ type, status }) => {
              setTypeFilter(type === "all" ? "" : type);
              setStatusFilter(status === "all" ? "" : status);
            }}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <ActivityModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingActivity(undefined);
        }}
        activity={editingActivity ?? null}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingActivity(undefined);
        }}
        title="Delete Activity"
        message={
          <>
            Are you sure you want to delete <strong>{deletingActivity?.subject}</strong>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />

      <ActivityWorkspace
        onChanged={() => {
          activityService.findAll().then((result) => {
            if (mountedRef.current) setActivities(result.data);
          });
        }}
      />
    </div>
  );
}
