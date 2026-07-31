"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Pencil, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";
import { OpportunityForm } from "./OpportunityForm";
import type { Opportunity } from "../types";

interface EditOpportunityDialogProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  onSaved?: () => void;
}

export function EditOpportunityDialog({ open, onClose, opportunity, onSaved }: EditOpportunityDialogProps) {
  const { success, error: showError } = useToastContext();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: Opportunity) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          value: data.value,
          stage: data.stage,
          probability: data.probability,
          expectedCloseDate: data.expectedCloseDate || null,
          notes: data.notes || null,
          status: data.status,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      success("Opportunity updated", `${data.title} has been saved.`);
      onSaved?.();
      onClose();
    } catch {
      showError("Error", "Could not update opportunity.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Pencil className="h-4 w-4 text-blue-500" />
                Edit Opportunity
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <OpportunityForm
                initialData={opportunity}
                onSubmit={(data) => void handleSubmit(data)}
                onCancel={onClose}
              />
            </div>
            {saving && (
              <div className="flex items-center justify-center border-t py-2 text-xs text-slate-500">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Saving...
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
