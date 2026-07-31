"use client";

import { useEffect, useState } from "react";
import { X, UserRound } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";

interface AssignOpportunityDialogProps {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  opportunityTitle: string;
  currentOwnerId?: string;
  onAssigned?: () => void;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

export function AssignOpportunityDialog({
  open,
  onClose,
  opportunityId,
  opportunityTitle,
  currentOwnerId,
  onAssigned,
}: AssignOpportunityDialogProps) {
  const { success, error: showError } = useToastContext();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body) => {
        setUsers(Array.isArray(body.data) ? body.data : []);
        setSelected(currentOwnerId ?? "");
      });
  }, [open, currentOwnerId]);

  const handleAssign = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: selected || null }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      success("Opportunity assigned", `${opportunityTitle} has been assigned.`);
      onAssigned?.();
      onClose();
    } catch {
      showError("Error", "Could not assign opportunity.");
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
                Assign Opportunity
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{opportunityTitle}</p>
                <p className="text-xs text-slate-500">Assign this opportunity to a sales owner.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Owner</label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
                >
                  <option value="">Unassigned</option>
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
