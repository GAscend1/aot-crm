"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { contactService } from "@/services/index";
import type { Contact } from "@/services/contact.service";
import { ContactModal } from "./ContactModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ContactToolbar } from "./ContactToolbar";
import { ContactWorkspace } from "./ContactWorkspace";

export function ContactTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | undefined>();

  useEffect(() => {
    contactService
      .findAll()
      .then((result) => {
        setContacts(result.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load contacts.");
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
    setModalOpen(true);
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
        setModalOpen(false);
        setEditingContact(undefined);
      } catch (err) {
        showError("Error", "Failed to save contact.");
        throw err;
      }
    },
    [editingContact, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingContact) return;
    const target = deletingContact;
    const previous = contacts;
    // Optimistic removal; restored if the API call fails.
    setContacts((prev) => prev.filter((c) => c.id !== target.id));
    setDeleteDialogOpen(false);
    setDeletingContact(undefined);
    try {
      await contactService.delete(target.id);
      success("Contact archived", `${target.firstName} ${target.lastName} has been archived.`);
    } catch {
      setContacts(previous);
      showError("Error", "Failed to archive contact.");
    }
  }, [contacts, deletingContact, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingContact(undefined);
    setModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await contactService.findAll();
      setContacts(result.data);
    } catch {
      setError("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
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
        success("Archived", `${rows.length} contact(s) archived.`);
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

      <ContactModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingContact(undefined);
        }}
        contact={editingContact}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingContact(undefined);
        }}
        title="Archive Contact"
        message={
          <>
            Archive <strong>{deletingContact?.firstName} {deletingContact?.lastName}</strong>?
            This will remove the contact from active lists while keeping linked
            records intact.
          </>
        }
        confirmLabel="Archive"
        variant="danger"
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
