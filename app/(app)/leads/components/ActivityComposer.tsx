"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityComposerProps {
  leadId: string;
  onCreated?: () => void;
}

const activityTypes = ["Call", "Email", "Meeting", "Task", "Note", "Comment"] as const;

export function ActivityComposer({ leadId, onCreated }: ActivityComposerProps) {
  const [type, setType] = useState<(typeof activityTypes)[number]>("Note");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Planned");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          subject,
          description: description || undefined,
          status,
          dueDate: dueDate || null,
          leadId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add activity");
      }
      setSubject("");
      setDescription("");
      setDueDate("");
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add activity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="rounded-lg border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-blue-400 dark:border-slate-700"
        >
          {activityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add details (optional)"
        rows={2}
        className="mt-2 w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-blue-400 dark:border-slate-700"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-blue-400 dark:border-slate-700"
        >
          <option value="Planned">Planned</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? <X className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {saving ? "Adding..." : "Add Activity"}
          </Button>
        </div>
      </div>
    </div>
  );
}
