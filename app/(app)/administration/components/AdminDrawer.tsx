"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { User } from "../types";
import { AdminForm } from "./AdminForm";

interface AdminDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSave: (user: User) => void;
}

export function AdminDrawer({
  open,
  onOpenChange,
  user,
  onSave,
}: AdminDrawerProps) {
  const title = user ? user.name : "Add User";
  const description = user
    ? `Editing ${user.name}`
    : "Fill in the details to create a new user.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <AdminForm
            initialData={user ?? undefined}
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
