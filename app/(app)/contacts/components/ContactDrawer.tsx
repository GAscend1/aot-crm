"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { Contact } from "../types";
import { ContactForm } from "./ContactForm";

interface ContactDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  onSave: (contact: Contact) => void;
}

export function ContactDrawer({
  open,
  onOpenChange,
  contact,
  onSave,
}: ContactDrawerProps) {
  const isEditing = !!contact;

  function handleSave() {
    onSave(contact!);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Edit Contact" : "Add Contact"}
          </SheetTitle>

          <SheetDescription>
            {isEditing
              ? "Update the contact details below."
              : "Fill in the details to add a new contact."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <ContactForm contact={contact} />
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleSave}>
            {isEditing ? "Update" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
