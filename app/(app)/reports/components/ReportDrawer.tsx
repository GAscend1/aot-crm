"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Report } from "../types";
import { ReportForm } from "./ReportForm";

interface ReportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: Report | null;
  onSave: (report: Report) => void;
}

export function ReportDrawer({
  open,
  onOpenChange,
  report,
  onSave,
}: ReportDrawerProps) {
  const title = report ? report.name : "Create Report";
  const description = report
    ? `Editing ${report.name}`
    : "Fill in the details to create a new report.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <ReportForm
            initialData={report ?? undefined}
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
