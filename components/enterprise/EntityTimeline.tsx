"use client";

import { motion } from "framer-motion";
import {
  Phone,
  CalendarClock,
  Mail,
  CheckSquare,
  StickyNote,
  MessageSquare,
  FileText,
  Activity as ActivityIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineItem =
  | {
      id: string;
      kind: "activity";
      type: string;
      title: string;
      description?: string;
      status?: string;
      owner?: string;
      createdAt: string;
    }
  | {
      id: string;
      kind: "document";
      title: string;
      uploadedBy?: string;
      createdAt: string;
    }
  | {
      id: string;
      kind: "audit";
      action: string;
      description?: string;
      createdAt: string;
    };

interface EntityTimelineProps {
  entries: TimelineItem[];
}

interface TimelineSource {
  activities?: {
    id: string;
    type: string;
    subject: string;
    description?: string | null;
    status?: string;
    owner?: string;
    createdAt: string;
  }[];
  documents?: {
    id: string;
    name: string;
    uploadedBy?: string;
    createdAt: string;
  }[];
  auditEvents?: {
    id: string;
    action: string;
    description?: string | null;
    createdAt: string | Date;
  }[];
}

/** Merge activities + document uploads + audit events into one sorted feed. */
export function buildEntityTimeline(source: TimelineSource): TimelineItem[] {
  const items: TimelineItem[] = [
    ...(source.activities ?? []).map<TimelineItem>((a) => ({
      id: a.id,
      kind: "activity",
      type: a.type,
      title: a.subject,
      description: a.description ?? undefined,
      status: a.status,
      owner: a.owner,
      createdAt: a.createdAt,
    })),
    ...(source.documents ?? []).map<TimelineItem>((d) => ({
      id: d.id,
      kind: "document",
      title: d.name,
      uploadedBy: d.uploadedBy,
      createdAt: d.createdAt,
    })),
    ...(source.auditEvents ?? []).map<TimelineItem>((e) => ({
      id: e.id,
      kind: "audit",
      action: e.action,
      description: e.description ?? undefined,
      createdAt:
        typeof e.createdAt === "string"
          ? e.createdAt
          : e.createdAt.toISOString(),
    })),
  ];
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const TYPE_ICON: Record<string, { icon: React.ElementType; classes: string }> = {
  Call: { icon: Phone, classes: "bg-[color:var(--chart-1)]/[0.12] text-[color:var(--chart-1)]" },
  Meeting: { icon: CalendarClock, classes: "bg-[color:var(--chart-3)]/[0.12] text-[color:var(--chart-3)]" },
  Email: { icon: Mail, classes: "bg-[color:var(--info)]/[0.12] text-[color:var(--info)]" },
  Task: { icon: CheckSquare, classes: "bg-[color:var(--chart-5)]/[0.12] text-[color:var(--chart-5)]" },
  Note: { icon: StickyNote, classes: "bg-[color:var(--chart-6)]/[0.12] text-[color:var(--chart-6)]" },
  Comment: { icon: MessageSquare, classes: "bg-muted text-muted-foreground" },
};

export function EntityTimeline({ entries }: EntityTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
        <ActivityIcon className="h-8 w-8" />
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-px bg-border" aria-hidden="true" />
      <div className="space-y-0">
        {entries.map((entry, index) => (
          <motion.div
            key={`${entry.kind}:${entry.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3) }}
            className="relative flex gap-4 pb-5 pl-10"
          >
            <TimelineDot entry={entry} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {entry.kind === "audit" ? entry.action : entry.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatTimestamp(entry.createdAt)}
                </span>
              </div>
              {entry.kind === "activity" && entry.owner && (
                <p className="text-xs text-muted-foreground">{entry.owner}</p>
              )}
              {"description" in entry && entry.description && (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{entry.description}</p>
              )}
              {entry.kind === "document" && entry.uploadedBy && (
                <p className="text-xs text-muted-foreground">Uploaded by {entry.uploadedBy}</p>
              )}
              {entry.kind === "activity" && entry.status && (
                <span className="mt-1 inline-flex rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {entry.status}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TimelineDot({ entry }: { entry: TimelineItem }) {
  if (entry.kind === "activity") {
    const config = TYPE_ICON[entry.type] ?? TYPE_ICON.Note;
    const Icon = config.icon;
    return (
      <div
        className={cn(
          "absolute left-2.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background",
          config.classes
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (entry.kind === "document") {
    return (
      <div className="absolute left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-info-soft text-[color:var(--info)] ring-4 ring-background">
        <FileText className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <div className="absolute left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-success-soft text-[color:var(--success)] ring-4 ring-background">
      <RefreshCw className="h-3.5 w-3.5" />
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const mins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
