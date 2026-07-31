"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Invoice } from "../types";
import { InvoiceForm } from "./InvoiceForm";

export interface InvoicePrefill {
  customer?: string;
  company?: string;
  opportunity?: string;
  customerId?: string;
  companyId?: string;
  opportunityId?: string;
}

interface InvoiceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  prefill?: InvoicePrefill;
  onSave: (invoice: Invoice) => void;
}

export function InvoiceDrawer({ open, onOpenChange, invoice, prefill, onSave }: InvoiceDrawerProps) {
  const title = invoice ? `Edit ${invoice.invoiceNumber}` : "Create Invoice";
  const description = invoice ? `Editing ${invoice.invoiceNumber}` : "Fill in the details to create a new invoice.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <InvoiceForm
            initialData={invoice ?? undefined}
            prefill={prefill}
            onSubmit={(data) => {
              onSave(data);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
