"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Receipt, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";

interface ConvertQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  quoteNumber: string;
}

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
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-md flex-col rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Receipt className="h-4 w-4 text-emerald-500" />
                Convert to Invoice
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-3 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Convert <span className="font-semibold text-slate-900 dark:text-white">{quoteNumber}</span> into an invoice?
              </p>
              <ul className="space-y-1 rounded-lg border bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <li>• Line items and totals will be copied</li>
                <li>• The invoice will be linked to the opportunity, customer, and company</li>
                <li>• A timeline activity will be created</li>
                <li>• The quote cannot be converted twice</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3 dark:border-slate-800">
              <Button variant="outline" onClick={onClose} disabled={converting}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => void handleConfirm()} disabled={converting}>
                {converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}
                {converting ? "Converting..." : "Convert to Invoice"}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
