"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Company } from "../types";
import { CompanyForm } from "./CompanyForm";

interface CompanyModalProps {
  open: boolean;
  onClose: () => void;
  company?: Company;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (company: Company) => Promise<void>;
}

export function CompanyModal({
  open,
  onClose,
  company,
  onSave,
}: CompanyModalProps) {
  const title = company ? company.name : "Add Company";
  const description = company
    ? `Editing ${company.name}`
    : "Fill in the details to create a new company.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <CompanyForm
        initialData={company}
        onSubmit={onSave}
        onCancel={onClose}
      />
    </RecordModal>
  );
}
