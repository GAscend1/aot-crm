"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Document } from "../types";
import { DocumentForm } from "./DocumentForm";

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  document?: Document | null;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (document: Document) => Promise<void> | void;
}

export function DocumentModal({
  open,
  onClose,
  document: doc,
  onSave,
}: DocumentModalProps) {
  const title = doc ? doc.name : "Add Document";
  const description = doc
    ? `Editing ${doc.name}`
    : "Fill in the details to create a new document.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <DocumentForm
        initialData={doc ?? undefined}
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