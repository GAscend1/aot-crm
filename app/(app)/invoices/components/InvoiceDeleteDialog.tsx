"use client";

import { Button } from "@/components/ui/button";
import { Invoice } from "../types";

interface InvoiceDeleteDialogProps {
  open: boolean;
  invoice: Invoice | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function InvoiceDeleteDialog({ open, invoice, onConfirm, onCancel }: InvoiceDeleteDialogProps) {
  if (!open || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/10 backdrop-blur-xs" onClick={onCancel} />
      <div className="relative z-50 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg ring-1 ring-foreground/10">
        <h3 className="text-lg font-semibold">Archive Invoice</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to archive <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>?
          This will remove it from active views.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
