"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { activities as initialData } from "../data";
import { Activity, ActivityStatus, ActivityType } from "../types";
import { createColumns } from "../columns";
import { ActivityDrawer } from "./ActivityDrawer";
import { ActivityDeleteDialog } from "./ActivityDeleteDialog";
import { ActivityToolbar } from "./ActivityToolbar";

export function ActivityTable() {
  const [data, setData] = useState(initialData);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<Activity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    type: ActivityType | "all";
    status: ActivityStatus | "all";
  }>({ type: "all", status: "all" });

  const filteredData = useMemo(() => {
    return data.filter((activity) => {
      const matchesSearch =
        !search ||
        activity.subject.toLowerCase().includes(search.toLowerCase()) ||
        activity.owner.toLowerCase().includes(search.toLowerCase()) ||
        activity.relatedTo.toLowerCase().includes(search.toLowerCase());
      const matchesType =
        filters.type === "all" || activity.type === filters.type;
      const matchesStatus =
        filters.status === "all" || activity.status === filters.status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, search, filters]);

  function handleAdd() {
    setSelectedActivity(null);
    setDrawerOpen(true);
  }

  function handleView(activity: Activity) {
    setSelectedActivity(activity);
    setDrawerOpen(true);
  }

  function handleEdit(activity: Activity) {
    setSelectedActivity(activity);
    setDrawerOpen(true);
  }

  function handleDelete(activity: Activity) {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  }

  function handleSave(activity: Activity) {
    if (selectedActivity) {
      setData((prev) =>
        prev.map((a) => (a.id === selectedActivity.id ? activity : a))
      );
    } else {
      setData((prev) => [...prev, activity]);
    }
    setDrawerOpen(false);
    setSelectedActivity(null);
  }

  function handleConfirmDelete() {
    if (activityToDelete) {
      setData((prev) => prev.filter((a) => a.id !== activityToDelete.id));
    }
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
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
      <ActivityToolbar
        onAdd={handleAdd}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
      />

      <DataTable columns={columns} data={filteredData} />

      <ActivityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        activity={selectedActivity}
        onSave={handleSave}
      />

      <ActivityDeleteDialog
        open={deleteDialogOpen}
        activity={activityToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
