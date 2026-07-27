"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { users as initialData } from "../data";
import { Department, User, UserStatus } from "../types";
import { createColumns } from "../columns";
import { AdminDrawer } from "./AdminDrawer";
import { AdminDeleteDialog } from "./AdminDeleteDialog";
import { AdminToolbar } from "./AdminToolbar";

export function AdminTable() {
  const [data, setData] = useState(initialData);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    role: string;
    department: string;
    status: UserStatus | "all";
  }>({ role: "all", department: "all", status: "all" });

  const departments = useMemo(
    () => [...new Set(data.map((u) => u.department))] as Department[],
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.department.toLowerCase().includes(search.toLowerCase()) ||
        user.team.toLowerCase().includes(search.toLowerCase());
      const matchesRole =
        filters.role === "all" || user.role === filters.role;
      const matchesDepartment =
        filters.department === "all" || user.department === filters.department;
      const matchesStatus =
        filters.status === "all" || user.status === filters.status;
      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
  }, [data, search, filters]);

  function handleAdd() {
    setSelectedUser(null);
    setDrawerOpen(true);
  }

  function handleView(user: User) {
    setSelectedUser(user);
    setDrawerOpen(true);
  }

  function handleEdit(user: User) {
    setSelectedUser(user);
    setDrawerOpen(true);
  }

  function handleDelete(user: User) {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }

  function handleSave(user: User) {
    if (selectedUser) {
      setData((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? user : u))
      );
    } else {
      setData((prev) => [...prev, user]);
    }
    setDrawerOpen(false);
    setSelectedUser(null);
  }

  function handleConfirmDelete() {
    if (userToDelete) {
      setData((prev) => prev.filter((u) => u.id !== userToDelete.id));
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  }

  function handleCancelDelete() {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  }

  const columns = useMemo(
    () => createColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDelete }),
    []
  );

  return (
    <>
      <AdminToolbar
        onAdd={handleAdd}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilters}
        departments={departments}
      />

      <DataTable
        columns={columns}
        data={filteredData}
      />

      <AdminDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        user={selectedUser}
        onSave={handleSave}
      />

      <AdminDeleteDialog
        open={deleteDialogOpen}
        user={userToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
