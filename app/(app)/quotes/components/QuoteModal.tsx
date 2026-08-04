"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Quote } from "../types";
import { QuoteForm, type QuotePrefill } from "./QuoteForm";

interface QuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: Quote | null;
  prefill?: QuotePrefill;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (quote: Quote) => Promise<void> | void;
}

/**
 * Centered modal for creating/editing quotes.
 * Replaces the previous right-side Sheet drawer with the standardized
 * RecordModal so the line-item editor stays visible in a wide, scrollable body.
 */
export function QuoteModal({ open, onOpenChange, quote, prefill, onSave }: QuoteModalProps) {
  const title = quote ? `Edit ${quote.quoteNumber}` : "Create Quote";
  const description = quote
    ? `Editing ${quote.quoteNumber}`
    : "Fill in the details to create a new quote.";

  return (
    <RecordModal
      open={open}
      onClose={() => onOpenChange(false)}
      title={title}
      description={description}
      size="xl"
    >
      <QuoteForm
        initialData={quote ?? undefined}
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
