"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Activity } from "../types";
import { ActivityForm } from "./ActivityForm";

interface ActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  onSave: (activity: Activity) => void;
}

export function ActivityDrawer({
  open,
  onOpenChange,
  activity,
  onSave,
}: ActivityDrawerProps) {
  const title = activity ? activity.subject : "Add Activity";
  const description = activity
    ? `Editing ${activity.subject}`
    : "Fill in the details to create a new activity.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <ActivityForm
            initialData={activity ?? undefined}
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
