"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { User } from "../types";
import { AdminForm } from "./AdminForm";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (user: User) => Promise<void> | void;
}

export function AdminModal({
  open,
  onClose,
  user,
  onSave,
}: AdminModalProps) {
  const title = user ? user.name : "Add User";
  const description = user
    ? `Editing ${user.name}`
    : "Fill in the details to create a new user.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <AdminForm
        initialData={user ?? undefined}
        onSubmit={(data) =>
          Promise.resolve(onSave(data)).then(
            () => onClose(),
            () => {
              // Save failed; keep the modal open so the user can retry.
            }
          )
        }
        onCancel={onClose}
      />
    </RecordModal>
  );
}