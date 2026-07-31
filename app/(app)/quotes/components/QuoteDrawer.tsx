"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Quote } from "../types";
import { QuoteForm } from "./QuoteForm";

export interface QuotePrefill {
  customer?: string;
  company?: string;
  opportunity?: string;
  customerId?: string;
  companyId?: string;
  opportunityId?: string;
  leadId?: string;
}

interface QuoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: Quote | null;
  prefill?: QuotePrefill;
  onSave: (quote: Quote) => void;
}

export function QuoteDrawer({ open, onOpenChange, quote, prefill, onSave }: QuoteDrawerProps) {
  const title = quote ? `Edit ${quote.quoteNumber}` : "Create Quote";
  const description = quote ? `Editing ${quote.quoteNumber}` : "Fill in the details to create a new quote.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <QuoteForm
            initialData={quote ?? undefined}
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
