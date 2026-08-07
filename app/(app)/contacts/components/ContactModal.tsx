"use client";

import { RecordModal } from "@/components/common/RecordModal";

import type { Contact } from "../types";
import { ContactForm } from "./ContactForm";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  contact?: Contact;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (data: Partial<Contact>) => Promise<void>;
}

export function ContactModal({
  open,
  onClose,
  contact,
  onSave,
}: ContactModalProps) {
  const title = contact ? "Edit Contact" : "Add Contact";
  const description = contact
    ? "Update the contact details below."
    : "Fill in the details to add a new contact.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <ContactForm contact={contact} onSave={onSave} onCancel={onClose} />
    </RecordModal>
  );
}
