"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useToastContext } from "@/app/(app)/AppProviders";

type LeadReminder = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
};

export function LeadRemindersTab({ leadId }: { leadId: string }) {
  const [reminders, setReminders] = useState<LeadReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/leads/${leadId}/reminders`);
        if (!res.ok) throw new Error("Failed to load reminders");
        const body = (await res.json()) as { data: LeadReminder[] };
        if (!cancelled) setReminders(body.data);
      } catch {
        if (!cancelled) setReminders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const handleCreate = async () => {
    if (!title.trim() || !dueDate) {
      showError("Title and due date are required");
      return;
    }
    try {
      const res = await fetch(`/api/leads/${leadId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create reminder");
      }
      const body = (await res.json()) as { data: LeadReminder };
      setReminders((prev) => [...prev, body.data].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setTitle("");
      setDueDate("");
      success("Reminder created");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create reminder");
    }
  };

  const handleToggle = async (reminder: LeadReminder) => {
    const res = await fetch(`/api/reminders/${reminder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !reminder.completed }),
    });
    if (res.ok) {
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, completed: !r.completed } : r))
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-surface-raised p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reminder title"
            className="min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </button>
        </div>
      </div>

      <SectionCard title={`Reminders (${reminders.length})`}>
        {loading ? (
          <div className="space-y-3 py-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <EmptyState title="No reminders yet" description="Set reminders for follow-ups and next steps." />
        ) : (
          <div className="divide-y divide-border">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center gap-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-[color:var(--warning)]">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${reminder.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {reminder.title}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{new Date(reminder.dueDate).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleToggle(reminder)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-[color:var(--success)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  title={reminder.completed ? "Mark as pending" : "Mark as completed"}
                >
                  <CheckCircle2 className={`h-4 w-4 ${reminder.completed ? "text-[color:var(--success)]" : ""}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
