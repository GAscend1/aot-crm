"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Opportunity } from "../types";
import { OpportunityForm } from "./OpportunityForm";

interface OpportunityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
  onSave: (opportunity: Opportunity) => void;
}

export function OpportunityDrawer({
  open,
  onOpenChange,
  opportunity,
  onSave,
}: OpportunityDrawerProps) {
  const title = opportunity ? opportunity.title : "Add Opportunity";
  const description = opportunity
    ? `Editing ${opportunity.title}`
    : "Fill in the details to create a new opportunity.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <OpportunityForm
            initialData={opportunity ?? undefined}
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
