"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { contactService } from "@/services/index";
import type { Contact } from "@/services/contact.service";
import { ContactDrawer } from "./ContactDrawer";
import { ContactDeleteDialog } from "./ContactDeleteDialog";
import { ContactToolbar } from "./ContactToolbar";
import { ContactWorkspace } from "./ContactWorkspace";

export function ContactTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | undefined>();

  useEffect(() => {
    contactService.findAll().then((result) => {
      setContacts(result.data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = contacts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }

    return result;
  }, [contacts, searchQuery, statusFilter]);

  const handleEdit = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback((contact: Contact) => {
    setDeletingContact(contact);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (contact: Contact) => {
      router.push(`/contacts?record=${encodeURIComponent(contact.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const columns = useMemo(
    () => createColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete],
  );

  const handleSave = useCallback(
    async (data: Partial<Contact>) => {
      try {
        if (editingContact) {
          const updated = await contactService.update(editingContact.id, data);
          setContacts((prev) =>
            prev.map((c) => (c.id === editingContact.id ? updated : c)),
          );
          success("Contact updated", `${updated.firstName} ${updated.lastName} has been updated.`);
        } else {
          const created = await contactService.create(data as Omit<Contact, "id" | "createdAt" | "updatedAt">);
          setContacts((prev) => [created, ...prev]);
          success("Contact created", `${created.firstName} ${created.lastName} has been added.`);
        }
        setDrawerOpen(false);
        setEditingContact(undefined);
      } catch {
        showError("Error", "Failed to save contact.");
      }
    },
    [editingContact, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingContact) {
      try {
        await contactService.delete(deletingContact.id);
        setContacts((prev) =>
          prev.filter((c) => c.id !== deletingContact.id),
        );
        success("Contact deleted", `${deletingContact.firstName} ${deletingContact.lastName} has been removed.`);
        setDeletingContact(undefined);
      } catch {
        showError("Error", "Failed to delete contact.");
      }
    }
  }, [deletingContact, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingContact(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await contactService.findAll();
    setContacts(result.data);
    setLoading(false);
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Contact[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await contactService.delete(row.id);
        }
        setContacts((prev) =>
          prev.filter((c) => !rows.find((r) => r.id === c.id)),
        );
        success("Deleted", `${rows.length} contact(s) deleted.`);
      } else if (action === "export") {
        const csv = [
          "Name,Company,Email,Phone,Status,Created",
          ...rows.map(
            (r) =>
              `${r.firstName} ${r.lastName},${r.company},${r.email},${r.phone},${r.status},${r.createdAt}`,
          ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contacts.csv";
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
        onRowClick={handleRowClick}
        onBulkAction={handleBulkAction}
        toolbar={
          <ContactToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <ContactDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingContact(undefined);
        }}
        contact={editingContact}
        onSave={handleSave}
      />

      <ContactDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingContact(undefined);
        }}
        contact={deletingContact}
        onConfirm={handleConfirmDelete}
      />

      <ContactWorkspace
        onChanged={() => {
          contactService.findAll().then((result) => {
            setContacts(result.data);
          });
        }}
      />
    </div>
  );
}
