"use client";

import { useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastContext } from "@/app/(app)/AppProviders";

interface ActivityComposerProps {
  entityType?: "lead" | "opportunity" | "customer" | "ticket";
  entityId?: string;
  defaultType?: string;
  onCreated?: () => void;
  /**
   * "card" (default) renders the bordered card used across record workspaces.
   * "bar" renders a borderless, denser composer meant to sit inside a sticky
   * bottom bar (messaging-app style).
   */
  variant?: "card" | "bar";
  /** When provided, renders an attach control in the bar variant that invokes it. */
  onAttach?: () => void;
}

const activityTypes = ["Call", "Email", "Meeting", "Task", "Note", "Comment"] as const;

/**
 * Compact activity composer used inside record workspaces.
 * Posts to the real /api/activities endpoint (Supabase persistence).
 */
export function ActivityComposer({
  entityType,
  entityId,
  defaultType = "Note",
  onCreated,
  variant = "card",
  onAttach,
}: ActivityComposerProps) {
  const { success, error: showError } = useToastContext();
  const [type, setType] = useState<string>(defaultType);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setFieldError("Subject is required.");
      return;
    }
    setFieldError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        type,
        subject,
        description: description || undefined,
        status: "Planned",
        dueDate: dueDate || null,
      };
      if (entityType && entityId) body[`${entityType}Id`] = entityId;

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add activity");
      }
      setSubject("");
      setDescription("");
      setDueDate("");
      success("Activity added");
      onCreated?.();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to add activity");
    } finally {
      setSaving(false);
    }
  };

  if (variant === "bar") {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 w-auto min-w-24 gap-1.5 text-xs" aria-label="Activity type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="sr-only" htmlFor="activity-subject">
            Subject
          </label>
          <input
            id="activity-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSubmit();
            }}
            placeholder="Add a note, log a call, or plan a task…"
            aria-invalid={fieldError ? true : undefined}
            className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {fieldError && (
          <p className="mt-1.5 text-xs text-[color:var(--danger)]" role="alert">
            {fieldError}
          </p>
        )}
        <label className="sr-only" htmlFor="activity-comment">
          Comment
        </label>
        <textarea
          id="activity-comment"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a comment or extra details (optional)"
          rows={2}
          className="mt-2 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {onAttach ? (
              <button
                type="button"
                onClick={onAttach}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Paperclip className="size-3.5" />
                Attach
              </button>
            ) : null}
            <label className="sr-only" htmlFor="activity-due-bar">
              Due date
            </label>
            <input
              id="activity-due-bar"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button size="sm" onClick={() => void handleSubmit()} disabled={saving}>
            <Send className="size-3.5" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-surface-raised p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-8 w-auto min-w-28 gap-1.5 text-sm" aria-label="Activity type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="sr-only" htmlFor="activity-subject">
          Subject
        </label>
        <input
          id="activity-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSubmit();
          }}
          placeholder="Subject"
          aria-invalid={fieldError ? true : undefined}
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {fieldError && (
        <p className="mt-1.5 text-xs text-[color:var(--danger)]" role="alert">
          {fieldError}
        </p>
      )}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add details (optional)"
        rows={2}
        className="mt-2 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="activity-due">
          Due date
        </label>
        <input
          id="activity-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="ml-auto">
          <Button size="sm" onClick={() => void handleSubmit()} disabled={saving}>
            <Send className="size-3.5" />
            {saving ? "Adding..." : "Add Activity"}
          </Button>
        </div>
      </div>
    </div>
  );
}
