"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Invoice } from "../types";
import { InvoiceForm, type InvoicePrefill } from "./InvoiceForm";

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  prefill?: InvoicePrefill;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (invoice: Invoice) => Promise<void> | void;
}

/**
 * Centered modal for creating/editing invoices.
 * Replaces the previous right-side Sheet drawer with the standardized
 * RecordModal so the line-item editor stays visible in a wide, scrollable body.
 */
export function InvoiceModal({ open, onOpenChange, invoice, prefill, onSave }: InvoiceModalProps) {
  const title = invoice ? `Edit ${invoice.invoiceNumber}` : "Create Invoice";
  const description = invoice
    ? `Editing ${invoice.invoiceNumber}`
    : "Fill in the details to create a new invoice.";

  return (
    <RecordModal
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      description={description}
      size="xl"
    >
      <InvoiceForm
        initialData={invoice ?? undefined}
        prefill={prefill}
        onSubmit={(data) =>
          Promise.resolve(onSave(data)).then(
            () => onOpenChange(false),
            () => {
              // Save failed; keep the modal open so the user can retry.
            }
          )
        }
        onCancel={() => onOpenChange(false)}
      />
    </RecordModal>
  );
}
