"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Ticket } from "../types";
import { TicketForm } from "./TicketForm";

interface TicketDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket | null;
  onSave: (ticket: Ticket) => void;
}

export function TicketDrawer({
  open,
  onOpenChange,
  ticket,
  onSave,
}: TicketDrawerProps) {
  const title = ticket ? ticket.subject : "Add Ticket";
  const description = ticket
    ? `Editing ${ticket.subject}`
    : "Fill in the details to create a new ticket.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <TicketForm
            initialData={ticket ?? undefined}
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
