"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { documentService } from "@/services/index";
import type { Document } from "@/services/document.service";
import { DocumentDrawer } from "./DocumentDrawer";
import { DocumentDeleteDialog } from "./DocumentDeleteDialog";
import { DocumentToolbar } from "./DocumentToolbar";

export function DocumentTable() {
  const { success, error: showError } = useToastContext();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<Document | undefined>();

  useEffect(() => {
    documentService.findAll().then((result) => {
      setDocuments(result.data);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(
    () => [...new Set(documents.map((d) => d.category))] as Document["category"][],
    [documents],
  );

  const filtered = useMemo(() => {
    let result = documents;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.uploadedBy.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (categoryFilter) {
      result = result.filter((d) => d.category === categoryFilter);
    }

    if (statusFilter) {
      result = result.filter((d) => d.status === statusFilter);
    }

    return result;
  }, [documents, searchQuery, categoryFilter, statusFilter]);

  const handleEdit = useCallback((document: Document) => {
    setEditingDocument(document);
    setDrawerOpen(true);
  }, []);

  const handleView = useCallback((document: Document) => {
    setEditingDocument(document);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback((document: Document) => {
    setDeletingDocument(document);
    setDeleteDialogOpen(true);
  }, []);

  const columns = useMemo(
    () => createColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDelete }),
    [handleView, handleEdit, handleDelete],
  );

  const handleSave = useCallback(
    async (data: Document) => {
      try {
        if (editingDocument) {
          const updated = await documentService.update(editingDocument.id, data as Partial<Document>);
          setDocuments((prev) =>
            prev.map((d) => (d.id === editingDocument.id ? updated : d)),
          );
          success("Document updated", `${updated.name} has been updated.`);
        } else {
          const created = await documentService.create(data as Omit<Document, "id" | "createdAt" | "updatedAt">);
          setDocuments((prev) => [created, ...prev]);
          success("Document created", `${created.name} has been added.`);
        }
        setDrawerOpen(false);
        setEditingDocument(undefined);
      } catch {
        showError("Error", "Failed to save document.");
      }
    },
    [editingDocument, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingDocument) {
      try {
        await documentService.delete(deletingDocument.id);
        setDocuments((prev) =>
          prev.filter((d) => d.id !== deletingDocument.id),
        );
        success("Document deleted", `${deletingDocument.name} has been removed.`);
        setDeletingDocument(undefined);
      } catch {
        showError("Error", "Failed to delete document.");
      }
    }
  }, [deletingDocument, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingDocument(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await documentService.findAll();
    setDocuments(result.data);
    setLoading(false);
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Document[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await documentService.delete(row.id);
        }
        setDocuments((prev) =>
          prev.filter((d) => !rows.find((r) => r.id === d.id)),
        );
        success("Deleted", `${rows.length} document(s) deleted.`);
      } else if (action === "export") {
        const csv = [
          "Name,Category,Type,Size,Uploaded By,Status",
          ...rows.map(
            (r) =>
              `${r.name},${r.category},${r.type},${r.size},${r.uploadedBy},${r.status}`,
          ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "documents.csv";
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
          <DocumentToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{
              category: (categoryFilter || "all") as Document["category"] | "all",
              status: (statusFilter || "all") as Document["status"] | "all",
            }}
            onFilterChange={({ category, status }) => {
              setCategoryFilter(category === "all" ? "" : category);
              setStatusFilter(status === "all" ? "" : status);
            }}
            categories={categories}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <DocumentDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingDocument(undefined);
        }}
        document={editingDocument ?? null}
        onSave={handleSave}
      />

      <DocumentDeleteDialog
        open={deleteDialogOpen}
        document={deletingDocument ?? null}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingDocument(undefined);
        }}
      />
    </div>
  );
}
