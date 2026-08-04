"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Lead } from "../types";
import { LeadForm } from "./LeadForm";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  lead?: Lead | null;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (lead: Lead) => Promise<void>;
}

export function LeadModal({
  open,
  onClose,
  lead,
  onSave,
}: LeadModalProps) {
  const title = lead ? lead.title : "Add Lead";
  const description = lead
    ? `Editing ${lead.title}`
    : "Fill in the details to create a new lead.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <LeadForm
        initialData={lead ?? undefined}
        onSubmit={onSave}
        onCancel={onClose}
      />
    </RecordModal>
  );
}
