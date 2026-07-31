"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { useApiList } from "@/hooks/use-api-list";

import { Department, User, UserStatus } from "../types";
import { createColumns } from "../columns";
import { AdminDrawer } from "./AdminDrawer";
import { AdminDeleteDialog } from "./AdminDeleteDialog";
import { AdminToolbar } from "./AdminToolbar";

const USERS_PATH = "/api/admin/users?pageSize=1000";

export function AdminTable() {
  const { data, refresh } = useApiList<User>(USERS_PATH);
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

  async function handleSave(user: User) {
    const payload = {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      team: user.team,
      status: user.status,
    };
    try {
      if (selectedUser) {
        await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      refresh();
    } catch {
      // Keep current data on failure
    }
    setDrawerOpen(false);
    setSelectedUser(null);
  }

  async function handleConfirmDelete() {
    if (userToDelete) {
      try {
        await fetch(`/api/admin/users/${userToDelete.id}`, { method: "DELETE" });
        refresh();
      } catch {
        // Keep current data on failure
      }
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
