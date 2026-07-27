"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Customer } from "../types";

interface CustomerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  onConfirm: () => void;
}

export function CustomerDeleteDialog({
  open,
  onOpenChange,
  customer,
  onConfirm,
}: CustomerDeleteDialogProps) {
  if (!customer) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg ring-1 ring-foreground/10 duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogPrimitive.Title className="font-heading text-base font-medium text-foreground">
              Delete Customer
            </DialogPrimitive.Title>
          </div>
          <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{customer.name}</strong>? This action cannot be
            undone.
          </DialogPrimitive.Description>

          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogPrimitive.Close>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
