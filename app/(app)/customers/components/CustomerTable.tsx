"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMountedRef } from "@/hooks/use-mounted";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { customerService } from "@/services/index";
import type { Customer } from "@/services/customer.service";
import { CustomerModal } from "./CustomerModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CustomerToolbar } from "./CustomerToolbar";
import { CustomerWorkspace } from "./CustomerWorkspace";

export function CustomerTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | undefined>();

  const mountedRef = useMountedRef();

  useEffect(() => {
    customerService
      .findAll()
      .then((result) => {
        if (!mountedRef.current) return;
        setCustomers(result.data);
        setLoading(false);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setError("Failed to load customers.");
        setLoading(false);
      });
  }, [mountedRef]);

  const filtered = useMemo(() => {
    let result = customers;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }

    return result;
  }, [customers, searchQuery, statusFilter]);

  const handleEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((customer: Customer) => {
    setDeletingCustomer(customer);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (customer: Customer) => {
      // Customers is a view inside the Contacts module — navigate directly to
      // the merged workspace so the row click is a single client-side
      // transition.
      router.push(`/contacts?view=customers&record=${encodeURIComponent(customer.id)}`, {
        scroll: false,
      });
    },
    [router]
  );

  const columns = useMemo(
    () => createColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete],
  );

  const handleSave = useCallback(
    async (data: Partial<Customer>) => {
      try {
        if (editingCustomer) {
          const updated = await customerService.update(editingCustomer.id, data);
          setCustomers((prev) =>
            prev.map((c) => (c.id === editingCustomer.id ? updated : c))
          );
          success("Customer updated", `${updated.name} has been updated.`);
        } else {
          const created = await customerService.create(data as Omit<Customer, "id" | "createdAt" | "updatedAt">);
          setCustomers((prev) => [created, ...prev]);
          success("Customer created", `${created.name} has been added.`);
        }
        setModalOpen(false);
        setEditingCustomer(undefined);
      } catch (err) {
        showError("Error", "Failed to save customer.");
        throw err;
      }
    },
    [editingCustomer, success, showError]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingCustomer) return;
    const target = deletingCustomer;
    const previous = customers;
    // Optimistic removal; restored if the API call fails.
    setCustomers((prev) => prev.filter((c) => c.id !== target.id));
    setDeleteDialogOpen(false);
    setDeletingCustomer(undefined);
    try {
      await customerService.delete(target.id);
      success("Customer archived", `${target.name} has been archived.`);
    } catch {
      setCustomers(previous);
      showError("Error", "Failed to archive customer.");
    }
  }, [customers, deletingCustomer, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingCustomer(undefined);
    setModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerService.findAll();
      setCustomers(result.data);
    } catch {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Customer[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await customerService.delete(row.id);
        }
        setCustomers((prev) =>
          prev.filter((c) => !rows.find((r) => r.id === c.id))
        );
        success("Archived", `${rows.length} customer(s) archived.`);
      } else if (action === "export") {
        const csv = [
          "Name,Company,Email,Phone,Status,Created",
          ...rows.map(
            (r) =>
              `${r.name},${r.company},${r.email},${r.phone},${r.status},${r.createdAt}`
          ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "customers.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [success]
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
          <CustomerToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <CustomerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCustomer(undefined);
        }}
        customer={editingCustomer}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingCustomer(undefined);
        }}
        title="Archive Customer"
        message={
          <>
            Archive <strong>{deletingCustomer?.name}</strong>? This will remove
            the customer from active lists while keeping linked records intact.
          </>
        }
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />

      <CustomerWorkspace
        onChanged={() => {
          customerService.findAll().then((result) => {
            if (mountedRef.current) setCustomers(result.data);
          });
        }}
      />
    </div>
  );
}
