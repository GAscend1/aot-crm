"use client";

import { useState, useEffect, useCallback } from "react";
import { Phone, Mail, Calendar, ListTodo, StickyNote, MessageSquare, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ActivityComposer } from "./ActivityComposer";

type UIActivity = {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  time: string;
  owner: string;
  status: string;
  createdAt: string;
};

const typeIcons: Record<string, React.ElementType> = {
  Call: Phone,
  Email: Mail,
  Meeting: Calendar,
  Task: ListTodo,
  Note: StickyNote,
  Comment: MessageSquare,
};

const typeColors: Record<string, string> = {
  Call: "bg-success-soft text-[color:var(--success)]",
  Email: "bg-info-soft text-[color:var(--info)]",
  Meeting: "bg-[color:var(--color-quote-soft)] text-[color:var(--color-quote)]",
  Task: "bg-warning-soft text-[color:var(--warning)]",
  Note: "bg-muted text-muted-foreground",
  Comment: "bg-[color:var(--color-activity-soft)] text-[color:var(--color-activity)]",
};

export function LeadActivitiesTab({ leadId }: { leadId: string }) {
  const [activities, setActivities] = useState<UIActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/activities?leadId=${leadId}&pageSize=50`);
        if (!res.ok) throw new Error("Failed to load activities");
        const body = (await res.json()) as { data: UIActivity[] };
        if (!cancelled) setActivities(body.data);
      } catch {
        if (!cancelled) setActivities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleToggleStatus = async (activity: UIActivity) => {
    const nextStatus = activity.status === "Completed" ? "Planned" : "Completed";
    const res = await fetch(`/api/activities/${activity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? { ...a, status: nextStatus } : a))
      );
    }
  };

  return (
    <div className="space-y-4">
      <ActivityComposer leadId={leadId} onCreated={reload} />
      <SectionCard title={`Activities (${activities.length})`}>
        {loading ? (
          <div className="space-y-3 py-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState title="No activities yet" description="Add a call, email, task, or note to track progress." />
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => {
              const Icon = typeIcons[activity.type] || ListTodo;
              const isDone = activity.status === "Completed";
              return (
                <div key={activity.id} className="flex items-start gap-3 py-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeColors[activity.type] || "bg-muted text-muted-foreground"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {activity.subject}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {activity.type}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground/80">{activity.description}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground/70">
                      {formatTimestamp(activity.createdAt)}
                      {activity.date ? ` · due ${activity.date}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(activity)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-[color:var(--success)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    title={isDone ? "Mark as not completed" : "Mark as completed"}
                  >
                    <CheckCircle2 className={`h-4 w-4 ${isDone ? "text-[color:var(--success)]" : ""}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
