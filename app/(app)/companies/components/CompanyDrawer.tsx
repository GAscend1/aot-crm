"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Company } from "../types";
import { CompanyForm } from "./CompanyForm";

interface CompanyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSave: (company: Company) => void;
}

export function CompanyDrawer({
  open,
  onOpenChange,
  company,
  onSave,
}: CompanyDrawerProps) {
  const title = company ? company.name : "Add Company";
  const description = company
    ? `Editing ${company.name}`
    : "Fill in the details to create a new company.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <CompanyForm
            initialData={company ?? undefined}
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
