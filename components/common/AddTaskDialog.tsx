"use client";

import { useState } from "react";
import { CheckSquare, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecordModal } from "./RecordModal";
import { useToastContext } from "@/app/(app)/AppProviders";

type EntityKind = "company" | "customer" | "lead" | "opportunity" | "ticket";

interface AddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  /** API field name, e.g. entityKind="company" posts companyId. */
  entityKind: EntityKind;
  entityId: string;
  onCreated?: () => void;
}

export function AddTaskDialog({ open, onClose, entityKind, entityId, onCreated }: AddTaskDialogProps) {
  const { success, error: showError } = useToastContext();
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!subject.trim()) {
      setFieldError("Task title is required.");
      return;
    }
    setFieldError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        type: "Task",
        subject: subject.trim(),
        priority,
        status: "Planned",
        dueDate: dueDate || null,
        [`${entityKind}Id`]: entityId,
      };
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create task");
      success("Task created", `${subject.trim()} was scheduled.`);
      setSubject("");
      setDueDate("");
      onCreated?.();
      onClose();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RecordModal
      open={open}
      onClose={onClose}
      title="Add Task"
      description="Schedule a follow-up task on this record."
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="add-task-title">
            Task title
          </label>
          <Input
            id="add-task-title"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Follow up on proposal"
            aria-invalid={fieldError ? true : undefined}
          />
          {fieldError && (
            <p className="text-xs text-[color:var(--danger)]" role="alert">{fieldError}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="add-task-due">
              Due date
            </label>
            <Input id="add-task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="add-task-priority">
              Priority
            </label>
            <select
              id="add-task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {["Low", "Normal", "High", "Urgent"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="mr-1.5 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-1.5 h-4 w-4" />}
            {saving ? "Saving..." : "Create Task"}
          </Button>
        </div>
      </div>
    </RecordModal>
  );
}
