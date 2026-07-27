"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Document } from "../types";
import { DocumentForm } from "./DocumentForm";

interface DocumentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: Document | null;
  onSave: (document: Document) => void;
}

export function DocumentDrawer({
  open,
  onOpenChange,
  document,
  onSave,
}: DocumentDrawerProps) {
  const title = document ? document.name : "Upload Document";
  const description = document
    ? `Editing ${document.name}`
    : "Fill in the details to upload a new document.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <DocumentForm
            initialData={document ?? undefined}
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