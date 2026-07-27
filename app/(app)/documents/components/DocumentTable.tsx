"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { documents as initialData } from "../data";
import { Document, DocumentCategory, DocumentStatus } from "../types";
import { createColumns } from "../columns";
import { DocumentDrawer } from "./DocumentDrawer";
import { DocumentDeleteDialog } from "./DocumentDeleteDialog";
import { DocumentToolbar } from "./DocumentToolbar";

export function DocumentTable() {
  const [data, setData] = useState(initialData);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    status: DocumentStatus | "all";
    category: DocumentCategory | "all";
  }>({ status: "all", category: "all" });

  const categories = useMemo(
    () => [...new Set(data.map((d) => d.category))] as DocumentCategory[],
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((doc) => {
      const matchesSearch =
        !search ||
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        filters.status === "all" || doc.status === filters.status;
      const matchesCategory =
        filters.category === "all" || doc.category === filters.category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [data, search, filters]);

  function handleAdd() {
    setSelectedDocument(null);
    setDrawerOpen(true);
  }

  function handleView(document: Document) {
    setSelectedDocument(document);
    setDrawerOpen(true);
  }

  function handleEdit(document: Document) {
    setSelectedDocument(document);
    setDrawerOpen(true);
  }

  function handleDelete(document: Document) {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  }

  function handleSave(document: Document) {
    if (selectedDocument) {
      setData((prev) =>
        prev.map((d) => (d.id === selectedDocument.id ? document : d))
      );
    } else {
      setData((prev) => [...prev, document]);
    }
    setDrawerOpen(false);
    setSelectedDocument(null);
  }

  function handleConfirmDelete() {
    if (documentToDelete) {
      setData((prev) => prev.filter((d) => d.id !== documentToDelete.id));
    }
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  }

  const columns = useMemo(
    () => createColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDelete }),
    []
  );

  return (
    <>
      <DocumentToolbar
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

      <DocumentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        document={selectedDocument}
        onSave={handleSave}
      />

      <DocumentDeleteDialog
        open={deleteDialogOpen}
        document={documentToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}