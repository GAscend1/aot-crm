"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import type { Customer } from "../types";
import { CustomerForm } from "./CustomerForm";

interface CustomerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  onSave: (data: Partial<Customer>) => void;
}

export function CustomerDrawer({
  open,
  onOpenChange,
  customer,
  onSave,
}: CustomerDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {customer ? "Edit Customer" : "Add Customer"}
          </SheetTitle>
          <SheetDescription>
            {customer
              ? "Update the customer details below."
              : "Fill in the details to add a new customer."}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <CustomerForm
            customer={customer}
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
