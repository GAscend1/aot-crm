"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { customerService } from "@/services/index";
import type { Customer } from "@/services/customer.service";
import { CustomerDrawer } from "./CustomerDrawer";
import { CustomerDeleteDialog } from "./CustomerDeleteDialog";
import { CustomerToolbar } from "./CustomerToolbar";
import { CustomerWorkspace } from "./CustomerWorkspace";

export function CustomerTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | undefined>();

  useEffect(() => {
    customerService.findAll().then((result) => {
      setCustomers(result.data);
      setLoading(false);
    });
  }, []);

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
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback((customer: Customer) => {
    setDeletingCustomer(customer);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (customer: Customer) => {
      router.push(`/customers?record=${encodeURIComponent(customer.id)}`, {
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
        setDrawerOpen(false);
        setEditingCustomer(undefined);
      } catch {
        showError("Error", "Failed to save customer.");
      }
    },
    [editingCustomer, success, showError]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deletingCustomer) {
      try {
        await customerService.delete(deletingCustomer.id);
        setCustomers((prev) =>
          prev.filter((c) => c.id !== deletingCustomer.id)
        );
        success("Customer deleted", `${deletingCustomer.name} has been removed.`);
        setDeletingCustomer(undefined);
      } catch {
        showError("Error", "Failed to delete customer.");
      }
    }
  }, [deletingCustomer, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingCustomer(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const result = await customerService.findAll();
    setCustomers(result.data);
    setLoading(false);
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
        success("Deleted", `${rows.length} customer(s) deleted.`);
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

      <CustomerDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditingCustomer(undefined);
        }}
        customer={editingCustomer}
        onSave={handleSave}
      />

      <CustomerDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingCustomer(undefined);
        }}
        customer={deletingCustomer}
        onConfirm={handleConfirmDelete}
      />

      <CustomerWorkspace
        onChanged={() => {
          customerService.findAll().then((result) => {
            setCustomers(result.data);
          });
        }}
      />
    </div>
  );
}
