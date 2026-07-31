"use client";

import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { useApiList } from "@/hooks/use-api-list";

import { Report, ReportCategory, ReportStatus } from "../types";
import { createColumns } from "../columns";
import { ReportDrawer } from "./ReportDrawer";
import { ReportDeleteDialog } from "./ReportDeleteDialog";
import { ReportToolbar } from "./ReportToolbar";

const REPORTS_PATH = "/api/reports/manage?pageSize=1000";

export function ReportTable() {
  const { data, refresh } = useApiList<Report>(REPORTS_PATH);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    category: ReportCategory | "all";
    status: ReportStatus | "all";
  }>({ category: "all", status: "all" });

  const categories = useMemo(
    () => [...new Set(data.map((r) => r.category))] as ReportCategory[],
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((report) => {
      const matchesSearch =
        !search ||
        report.name.toLowerCase().includes(search.toLowerCase()) ||
        report.createdBy.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        filters.category === "all" || report.category === filters.category;
      const matchesStatus =
        filters.status === "all" || report.status === filters.status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data, search, filters]);

  const handleAdd = useCallback(() => {
    setSelectedReport(null);
    setDrawerOpen(true);
  }, []);

  const handleView = useCallback((report: Report) => {
    setSelectedReport(report);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((report: Report) => {
    setSelectedReport(report);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback((report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  }, []);

  const handleRun = useCallback(async (report: Report) => {
    try {
      await fetch(`/api/reports/manage/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastRun: new Date().toISOString().split("T")[0] }),
      });
      refresh();
    } catch {
      // Keep current data on failure
    }
  }, [refresh]);

  async function handleSave(report: Report) {
    const payload = {
      name: report.name,
      category: report.category,
      type: report.type,
      description: report.description,
      status: report.status,
      lastRun: report.lastRun || undefined,
    };
    try {
      if (selectedReport) {
        await fetch(`/api/reports/manage/${selectedReport.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/reports/manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      refresh();
    } catch {
      // Keep current data on failure
    }
    setDrawerOpen(false);
    setSelectedReport(null);
  }

  async function handleConfirmDelete() {
    if (reportToDelete) {
      try {
        await fetch(`/api/reports/manage/${reportToDelete.id}`, { method: "DELETE" });
        refresh();
      } catch {
        // Keep current data on failure
      }
    }
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  }

  const columns = useMemo(
    () =>
      createColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onRun: handleRun,
      }),
    [handleView, handleEdit, handleDelete, handleRun]
  );

  return (
    <>
      <ReportToolbar
        onAdd={handleAdd}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        categories={categories}
      />

      <DataTable
        columns={columns}
        data={filteredData}
      />

      <ReportDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        report={selectedReport}
        onSave={handleSave}
      />

      <ReportDeleteDialog
        open={deleteDialogOpen}
        report={reportToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
