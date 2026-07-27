"use client";

import { Button } from "@/components/ui/button";

import { User } from "../types";

interface AdminDeleteDialogProps {
  open: boolean;
  user: User | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminDeleteDialog({
  open,
  user,
  onConfirm,
  onCancel,
}: AdminDeleteDialogProps) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-xs"
        onClick={onCancel}
      />

      <div className="relative z-50 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg ring-1 ring-foreground/10">
        <h3 className="text-lg font-semibold">
          Delete User
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">
            {user.name}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
