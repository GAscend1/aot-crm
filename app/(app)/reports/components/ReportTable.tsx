"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { reports as initialData } from "../data";
import { Report, ReportCategory, ReportStatus } from "../types";
import { createColumns } from "../columns";
import { ReportDrawer } from "./ReportDrawer";
import { ReportDeleteDialog } from "./ReportDeleteDialog";
import { ReportToolbar } from "./ReportToolbar";

export function ReportTable() {
  const [data, setData] = useState(initialData);
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

  function handleAdd() {
    setSelectedReport(null);
    setDrawerOpen(true);
  }

  function handleView(report: Report) {
    setSelectedReport(report);
    setDrawerOpen(true);
  }

  function handleEdit(report: Report) {
    setSelectedReport(report);
    setDrawerOpen(true);
  }

  function handleDelete(report: Report) {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  }

  function handleRun(report: Report) {
    setData((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? { ...r, lastRun: new Date().toISOString().split("T")[0] }
          : r
      )
    );
  }

  function handleSave(report: Report) {
    if (selectedReport) {
      setData((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? report : r))
      );
    } else {
      setData((prev) => [...prev, report]);
    }
    setDrawerOpen(false);
    setSelectedReport(null);
  }

  function handleConfirmDelete() {
    if (reportToDelete) {
      setData((prev) => prev.filter((r) => r.id !== reportToDelete.id));
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
    []
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
