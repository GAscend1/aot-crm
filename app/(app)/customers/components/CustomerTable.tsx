"use client";

import { useState, useMemo, useCallback } from "react";

import { DataTable } from "@/components/table/DataTable";

import { createColumns } from "../columns";
import { customers as initialCustomers } from "../data";
import type { Customer } from "../types";
import { CustomerDrawer } from "./CustomerDrawer";
import { CustomerDeleteDialog } from "./CustomerDeleteDialog";
import { CustomerToolbar } from "./CustomerToolbar";

export function CustomerTable() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<
    Customer | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<
    Customer | undefined
  >();

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

  const handleSave = useCallback(
    (data: Partial<Customer>) => {
      if (editingCustomer) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? { ...c, ...data, updatedAt: new Date().toISOString().slice(0, 10) }
              : c,
          ),
        );
      } else {
        const newCustomer: Customer = {
          id: String(Date.now()),
          name: data.name ?? "",
          company: data.company ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          position: data.position ?? "",
          country: data.country ?? "",
          city: data.city ?? "",
          status: data.status ?? "Active",
          tags: data.tags ?? [],
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        setCustomers((prev) => [newCustomer, ...prev]);
      }
      setDrawerOpen(false);
      setEditingCustomer(undefined);
    },
    [editingCustomer],
  );

  const handleConfirmDelete = useCallback(() => {
    if (deletingCustomer) {
      setCustomers((prev) =>
        prev.filter((c) => c.id !== deletingCustomer.id),
      );
      setDeletingCustomer(undefined);
    }
  }, [deletingCustomer]);

  const columns = useMemo(
    () => createColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete],
  );

  const handleAdd = useCallback(() => {
    setEditingCustomer(undefined);
    setDrawerOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setCustomers([...initialCustomers]);
  }, []);

  return (
    <div className="space-y-6">
      <CustomerToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAdd={handleAdd}
        onRefresh={handleRefresh}
      />

      <DataTable columns={columns} data={filtered} />

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
    </div>
  );
}
