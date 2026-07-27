"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Lead } from "../types";
import { LeadForm } from "./LeadForm";

interface LeadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSave: (lead: Lead) => void;
}

export function LeadDrawer({
  open,
  onOpenChange,
  lead,
  onSave,
}: LeadDrawerProps) {
  const title = lead ? lead.title : "Add Lead";
  const description = lead
    ? `Editing ${lead.title}`
    : "Fill in the details to create a new lead.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <LeadForm
            initialData={lead ?? undefined}
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
