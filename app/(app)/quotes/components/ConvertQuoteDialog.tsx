"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToastContext } from "@/app/(app)/AppProviders";

interface ConvertQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  quoteNumber: string;
}

/**
 * Centered confirmation for converting a quote into an invoice.
 * Uses the shared ConfirmDialog so the destructive-action UX is consistent
 * with the rest of the CRM.
 */
export function ConvertQuoteDialog({ open, onClose, quoteId, quoteNumber }: ConvertQuoteDialogProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [converting, setConverting] = useState(false);

  const handleConfirm = async () => {
    setConverting(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to convert");
      }
      const invoice = (await res.json()) as { id: string; invoiceNumber: string };
      success("Invoice created", `${quoteNumber} converted to ${invoice.invoiceNumber}.`);
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Could not convert quote.");
      setConverting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Convert to Invoice"
      variant="info"
      confirmLabel="Convert to Invoice"
      loading={converting}
      onConfirm={() => void handleConfirm()}
      message={
        <>
          <p>
            Convert <span className="font-medium text-foreground">{quoteNumber}</span> into an invoice?
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• Line items and totals will be copied</li>
            <li>• The invoice will be linked to the opportunity, customer, and company</li>
            <li>• A timeline activity will be created</li>
            <li>• The quote cannot be converted twice</li>
          </ul>
        </>
      }
    />
  );
}
