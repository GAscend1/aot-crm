"use client";

import { useMemo, useState } from "react";

import { DataTable } from "@/components/table/DataTable";
import { useApiList } from "@/hooks/use-api-list";
import { useToastContext } from "@/app/(app)/AppProviders";

import { Department, User, UserStatus } from "../types";
import { createColumns } from "../columns";
import { AdminModal } from "./AdminModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AdminToolbar } from "./AdminToolbar";

const USERS_PATH = "/api/admin/users?pageSize=1000";

export function AdminTable() {
  const { data, loading, error, refresh } = useApiList<User>(USERS_PATH);
  const { success, error: showError } = useToastContext();
  const [modalOpen, setModalOpen] = useState(false);
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
    setModalOpen(true);
  }

  function handleView(user: User) {
    setSelectedUser(user);
    setModalOpen(true);
  }

  function handleEdit(user: User) {
    setSelectedUser(user);
    setModalOpen(true);
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
        const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Request failed");
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Request failed");
      }
      refresh();
      success(
        selectedUser ? "User updated" : "User created",
        `${user.name} has been ${selectedUser ? "updated" : "created"}.`
      );
      // Close only after the save succeeds, so errors keep the modal open.
      setModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      showError("Error", "Failed to save user.");
      throw err;
    }
  }

  async function handleConfirmDelete() {
    if (userToDelete) {
      try {
        const res = await fetch(`/api/admin/users/${userToDelete.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Request failed");
        refresh();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } catch {
        showError("Error", "Failed to delete user.");
      }
    } else {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
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
        loading={loading}
        error={error}
        onRetry={refresh}
      />

      <AdminModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        title="Delete User"
        message={
          <>
            Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
