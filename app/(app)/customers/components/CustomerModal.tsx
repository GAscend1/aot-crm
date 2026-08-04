"use client";

import { RecordModal } from "@/components/common/RecordModal";

import type { Customer } from "../types";
import { CustomerForm } from "./CustomerForm";

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (data: Partial<Customer>) => Promise<void>;
}

export function CustomerModal({
  open,
  onClose,
  customer,
  onSave,
}: CustomerModalProps) {
  const title = customer ? "Edit Customer" : "Add Customer";
  const description = customer
    ? "Update the customer details below."
    : "Fill in the details to add a new customer.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <CustomerForm customer={customer} onSave={onSave} onCancel={onClose} />
    </RecordModal>
  );
}
