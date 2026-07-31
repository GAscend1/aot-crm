"use client";

import { useState, useEffect } from "react";
import { X, UserRound } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";

interface AssignLeadDialogProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  leadTitle: string;
  currentOwnerId: string | null;
  onAssigned: () => void;
}

type UserOption = { id: string; name: string; email: string };

export function AssignLeadDialog({
  open,
  onClose,
  leadId,
  leadTitle,
  currentOwnerId,
  onAssigned,
}: AssignLeadDialogProps) {
  const { success, error: showError } = useToastContext();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>(currentOwnerId ?? "");
  const [prevOpen, setPrevOpen] = useState(open);
  const [saving, setSaving] = useState(false);

  if (open && prevOpen !== open) {
    setPrevOpen(open);
    setAssigneeId(currentOwnerId ?? "");
  }

  useEffect(() => {
    if (open) {
      fetch("/api/users")
        .then((r) => r.json())
        .then((body: { data: UserOption[] }) => setUsers(body.data))
        .catch(() => setUsers([]));
    }
  }, [open]);

  const handleAssign = async () => {
    if (!assigneeId) {
      showError("Select an owner");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to assign lead");
      }
      success("Lead assigned", `${leadTitle} assigned to the selected owner`);
      onAssigned();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to assign lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-md flex-col rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <UserRound className="h-4 w-4 text-blue-500" />
                Assign Lead
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{leadTitle}</p>
                <p className="text-xs text-slate-500">Choose a new owner for this lead.</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Owner</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
                >
                  <option value="">Select an owner...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3 dark:border-slate-800">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={saving}>
                {saving ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
