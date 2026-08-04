"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Opportunity } from "../types";
import { OpportunityForm } from "./OpportunityForm";

interface OpportunityModalProps {
  open: boolean;
  onClose: () => void;
  opportunity?: Opportunity | null;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (opportunity: Opportunity) => Promise<void>;
}

export function OpportunityModal({
  open,
  onClose,
  opportunity,
  onSave,
}: OpportunityModalProps) {
  const title = opportunity ? opportunity.title : "Add Opportunity";
  const description = opportunity
    ? `Editing ${opportunity.title}`
    : "Fill in the details to create a new opportunity.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <OpportunityForm
        initialData={opportunity ?? undefined}
        onSubmit={onSave}
        onCancel={onClose}
      />
    </RecordModal>
  );
}
