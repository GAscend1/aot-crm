"use client";

import { useCallback, useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { useApiList } from "@/hooks/use-api-list";
import { useToastContext } from "@/app/(app)/AppProviders";

import { Report, ReportCategory, ReportStatus } from "../types";
import { createColumns } from "../columns";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ReportModal } from "./ReportModal";
import { ReportToolbar } from "./ReportToolbar";

const REPORTS_PATH = "/api/reports/manage?pageSize=1000";

export function ReportTable() {
  const { data, loading, error, refresh } = useApiList<Report>(REPORTS_PATH);
  const { error: showError } = useToastContext();
  const [modalOpen, setModalOpen] = useState(false);
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
    setModalOpen(true);
  }, []);

  const handleView = useCallback((report: Report) => {
    setSelectedReport(report);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((report: Report) => {
    setSelectedReport(report);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  }, []);

  const handleRun = useCallback(async (report: Report) => {
    try {
      const res = await fetch(`/api/reports/manage/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastRun: new Date().toISOString().split("T")[0] }),
      });
      if (!res.ok) throw new Error("Request failed");
      refresh();
    } catch {
      showError("Error", "Could not run report.");
    }
  }, [refresh, showError]);

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
        const res = await fetch(`/api/reports/manage/${selectedReport.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Request failed");
      } else {
        const res = await fetch("/api/reports/manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Request failed");
      }
      refresh();
      // Close only after the save succeeds, so errors keep the modal open.
      setModalOpen(false);
      setSelectedReport(null);
    } catch (err) {
      showError("Error", "Failed to save report.");
      throw err;
    }
  }

  async function handleConfirmDelete() {
    if (reportToDelete) {
      try {
        const res = await fetch(`/api/reports/manage/${reportToDelete.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Request failed");
        refresh();
        setDeleteDialogOpen(false);
        setReportToDelete(null);
      } catch {
        showError("Error", "Failed to delete report.");
      }
    } else {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
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
        loading={loading}
        error={error}
        onRetry={refresh}
      />

      <ReportModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        title="Delete Report"
        message={
          <>
            Are you sure you want to delete <strong>{reportToDelete?.name}</strong>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
