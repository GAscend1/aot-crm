"use client";

import { useState, useEffect } from "react";
import { History, Plus, Edit3, Star, Trash2, Mail, Phone, Calendar, Copy, Repeat, FileUp, Flag, User } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";

type LeadHistoryEntry = {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  timestamp: string;
  source: "audit" | "activity";
};

const eventIcons: Record<string, React.ElementType> = {
  "lead.created": Plus,
  "lead.updated": Edit3,
  "lead.deleted": Trash2,
  "lead.assigned": User,
  "lead.starred": Star,
  "lead.unstarred": Star,
  "lead.duplicated": Copy,
  "lead.converted": Repeat,
  "lead.document_uploaded": FileUp,
  "lead.reminder_created": Flag,
  "activity.call": Phone,
  "activity.email": Mail,
  "activity.meeting": Calendar,
};

function eventIcon(type: string): React.ElementType {
  if (eventIcons[type]) return eventIcons[type];
  if (type.startsWith("activity.")) return History;
  return Edit3;
}

function colorFor(type: string): string {
  if (type.includes("deleted")) return "bg-danger-soft text-[color:var(--danger)]";
  if (type.includes("created") || type.includes("starred")) return "bg-success-soft text-[color:var(--success)]";
  if (type.includes("assigned") || type.includes("converted")) return "bg-[color:var(--color-quote-soft)] text-[color:var(--color-quote)]";
  return "bg-info-soft text-[color:var(--info)]";
}

export function LeadHistoryTab({ leadId }: { leadId: string }) {
  const [entries, setEntries] = useState<LeadHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/leads/${leadId}/history`);
        if (!res.ok) throw new Error("Failed to load history");
        const body = (await res.json()) as { data: LeadHistoryEntry[] };
        if (!cancelled) setEntries(body.data);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (loading) {
    return (
      <SectionCard title="History">
        <div className="space-y-3 py-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="History">
      {entries.length === 0 ? (
        <EmptyState title="No history yet" description="Changes and activities will appear here." />
      ) : (
        <div className="relative">
          <div className="absolute left-[13px] top-2 h-[calc(100%-16px)] w-px bg-border" />
          <div className="space-y-0">
            {entries.map((entry) => {
              const Icon = eventIcon(entry.eventType);
              return (
                <div key={entry.id} className="relative flex gap-3 pb-5 pl-9">
                  <div
                    className={`absolute left-1.5 flex h-6 w-6 items-center justify-center rounded-full ${colorFor(entry.eventType)} ring-4 ring-background`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{entry.actor}</span>
                      <span className="text-xs text-muted-foreground/70">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{entry.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </SectionCard>
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
