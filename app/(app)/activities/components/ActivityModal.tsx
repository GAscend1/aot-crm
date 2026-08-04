"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Activity } from "../types";
import { ActivityForm } from "./ActivityForm";

interface ActivityModalProps {
  open: boolean;
  onClose: () => void;
  activity?: Activity | null;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (activity: Activity) => Promise<void> | void;
}

export function ActivityModal({
  open,
  onClose,
  activity,
  onSave,
}: ActivityModalProps) {
  const title = activity ? activity.subject : "Add Activity";
  const description = activity
    ? `Editing ${activity.subject}`
    : "Fill in the details to create a new activity.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <ActivityForm
        initialData={activity ?? undefined}
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