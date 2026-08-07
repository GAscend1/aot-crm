"use client";

import { RecordModal } from "@/components/common/RecordModal";

import { Ticket } from "../types";
import { TicketForm } from "./TicketForm";

interface TicketModalProps {
  open: boolean;
  onClose: () => void;
  ticket?: Ticket | null;
  /** Async save. The modal stays open until it resolves successfully. */
  onSave: (ticket: Ticket) => Promise<void> | void;
}

export function TicketModal({
  open,
  onClose,
  ticket,
  onSave,
}: TicketModalProps) {
  const title = ticket ? ticket.subject : "Add Ticket";
  const description = ticket
    ? `Editing ${ticket.subject}`
    : "Fill in the details to create a new ticket.";

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
    >
      <TicketForm
        initialData={ticket ?? undefined}
        onSubmit={(data) =>
          Promise.resolve(onSave(data)).then(
            () => onClose(),
            () => {
              // Save failed; keep the modal open so the user can retry.
            }
          )
        }
        onCancel={onClose}
      />
    </RecordModal>
  );
}