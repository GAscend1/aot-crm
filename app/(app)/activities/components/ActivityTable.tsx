"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { activityService } from "@/services/index";
import type { Activity } from "@/services/activity.service";
import { ActivityDrawer } from "./ActivityDrawer";
import { ActivityDeleteDialog } from "./ActivityDeleteDialog";
import { ActivityToolbar } from "./ActivityToolbar";

export function ActivityTable() {
  const { success, error: showError } = useToastContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState<Activity | undefined>();

  useEffect(() => {
    activityService.findAll().then((result) => {
      setActivities(result.data);
      setLoading(false);
    });
  }, []);

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
    setDrawerOpen(true);
  }, []);

  const handleView = useCallback((activity: Activity) => {
    setEditingActivity(activity);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback((activity: Activity) => {
    setDeletingActivity(activity);
    setDeleteDialogOpen(true);
  }, []);

  const columns = useMemo(
    () => createColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDelete }),
    [handleView, handleEdit, handleDelete],
  );

  const handleSave = useCallback(
    async (data: Activity) => {
      try {
        if (editingActivity) {
          const updated = await activityService.update(editingActivity.id, data as Partial<Activity>);
          setActivities((prev) =>
            prev.map((a) => (a.id === editingActivity.id ? updated : a)),
          );
          success("Activity updated", `${updated.subject} has been updated.`);
        } else {
          const created = await activityService.create(data as Omit<Activity, "id" | "createdAt" | "updatedAt">);
          setActivities((prev) => [created, ...prev]);
          success("Activity created", `${created.subject} has been added.`);
        }
        setDrawerOpen(false);
        setEditingActivity(undefined);
      } catch {
        showError("Error", "Failed to save activity.");
      }
    },
    [editingActivity, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingActivity) {
      try {
        await activityService.delete(deletingActivity.id);
        setActivities((prev) =>
          prev.filter((a) => a.id !== deletingActivity.id),
        );
        success("Activity deleted", `${deletingActivity.subject} has been removed.`);
        setDeletingActivity(undefined);
      } catch {
        showError("Error", "Failed to delete activity.");
      }
    }
  }, [deletingActivity, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingActivity(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await activityService.findAll();
    setActivities(result.data);
    setLoading(false);
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

      <ActivityDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingActivity(undefined);
        }}
        activity={editingActivity ?? null}
        onSave={handleSave}
      />

      <ActivityDeleteDialog
        open={deleteDialogOpen}
        activity={deletingActivity ?? null}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingActivity(undefined);
        }}
      />
    </div>
  );
}
