"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import type { Contact } from "../types";
import { ContactForm } from "./ContactForm";

interface ContactDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  onSave: (data: Partial<Contact>) => void;
}

export function ContactDrawer({
  open,
  onOpenChange,
  contact,
  onSave,
}: ContactDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {contact ? "Edit Contact" : "Add Contact"}
          </SheetTitle>
          <SheetDescription>
            {contact
              ? "Update the contact details below."
              : "Fill in the details to add a new contact."}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <ContactForm
            contact={contact}
            onSave={(data) => {
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
