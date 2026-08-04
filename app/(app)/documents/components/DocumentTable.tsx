"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { documentService } from "@/services/index";
import type { Document } from "@/services/document.service";
import { DocumentModal } from "./DocumentModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DocumentToolbar } from "./DocumentToolbar";
import { DocumentWorkspace } from "./DocumentWorkspace";

export function DocumentTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<Document | undefined>();

  useEffect(() => {
    documentService
      .findAll()
      .then((result) => {
        setDocuments(result.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load documents.");
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
    setModalOpen(true);
  }, []);

  const handleView = useCallback(
    (document: Document) => {
      router.push(`/documents?record=${encodeURIComponent(document.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleDelete = useCallback((document: Document) => {
    setDeletingDocument(document);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (document: Document) => {
      router.push(`/documents?record=${encodeURIComponent(document.id)}`, {
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
        setModalOpen(false);
        setEditingDocument(undefined);
      } catch (err) {
        showError("Error", "Failed to save document.");
        throw err;
      }
    },
    [editingDocument, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingDocument) return;
    const target = deletingDocument;
    const previous = documents;
    // Optimistic removal; restored if the API call fails.
    setDocuments((prev) => prev.filter((d) => d.id !== target.id));
    setDeleteDialogOpen(false);
    setDeletingDocument(undefined);
    try {
      await documentService.delete(target.id);
      success("Document deleted", `${target.name} has been removed.`);
    } catch {
      setDocuments(previous);
      showError("Error", "Failed to delete document.");
    }
  }, [documents, deletingDocument, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingDocument(undefined);
    setModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentService.findAll();
      setDocuments(result.data);
    } catch {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
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

      <DocumentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDocument(undefined);
        }}
        document={editingDocument ?? null}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingDocument(undefined);
        }}
        title="Delete Document"
        message={
          <>
            Are you sure you want to delete <strong>{deletingDocument?.name}</strong>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />

      <DocumentWorkspace
        onChanged={() => {
          documentService.findAll().then((result) => {
            setDocuments(result.data);
          });
        }}
      />
    </div>
  );
}
