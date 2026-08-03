"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GitBranch,
  ClipboardList,
  FileText,
  Receipt,
  FileUp,
  Video,
  Calendar,
  CheckCircle2,
  UserRound,
  Loader2,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export type TimelineEntry = {
  id: string;
  type: "created" | "stage" | "activity" | "quote" | "invoice" | "document" | "meeting" | "assignment" | "audit";
  title: string;
  description: string;
  timestamp: string;
};

/** Activity subtype derived from the activities API (used by the feed tabs). */
type ActivitySubtype = "Call" | "Email" | "Meeting" | "Task" | "Note" | "Comment";

export type TimelineFilter =
  | "all"
  | "notes"
  | "emails"
  | "calls"
  | "meetings"
  | "tasks";

interface OpportunityTimelineProps {
  opportunityId: string;
  refreshKey?: number;
  /**
   * Compact, grouped rendering (Today / Yesterday / Older) used by the
   * opportunity modal workspace. The full-page view uses the default layout.
   */
  compact?: boolean;
  /** Tab filter applied to the feed (compact only). */
  filter?: TimelineFilter;
  /** Cap the number of rows and show a "View full history" expander (compact only). */
  limit?: number;
  /** Optional action for the per-row overflow menu (compact only). */
  onRowMore?: () => void;
}

const typeConfig: Record<TimelineEntry["type"], { icon: React.ElementType; color: string }> = {
  created: { icon: CheckCircle2, color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" },
  stage: { icon: GitBranch, color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" },
  activity: { icon: ClipboardList, color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" },
  quote: { icon: FileText, color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300" },
  invoice: { icon: Receipt, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300" },
  document: { icon: FileUp, color: "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300" },
  meeting: { icon: Video, color: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300" },
  assignment: { icon: UserRound, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" },
  audit: { icon: Calendar, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

/* Solid dot colors for the compact timeline rows. */
const dotColors: Record<TimelineEntry["type"], string> = {
  created: "bg-emerald-500",
  stage: "bg-blue-500",
  activity: "bg-violet-500",
  quote: "bg-amber-500",
  invoice: "bg-teal-500",
  document: "bg-sky-500",
  meeting: "bg-rose-500",
  assignment: "bg-indigo-500",
  audit: "bg-slate-400",
};

const DAY_MS = 86_400_000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayDiff(timestamp: string) {
  return Math.round((startOfDay(new Date()) - startOfDay(new Date(timestamp))) / DAY_MS);
}

function groupLabel(timestamp: string) {
  const diff = dayDiff(timestamp);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return "Older";
}

function timeLabel(timestamp: string) {
  const diff = dayDiff(timestamp);
  if (diff <= 0) return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
}

const COMPACT_GROUPS = ["Today", "Yesterday", "Older"] as const;

export function OpportunityTimeline({
  opportunityId,
  refreshKey = 0,
  compact = false,
  filter = "all",
  limit,
  onRowMore,
}: OpportunityTimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [subtypes, setSubtypes] = useState<Map<string, ActivitySubtype>>(new Map());
  const [owners, setOwners] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/opportunities/${opportunityId}/timeline`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: TimelineEntry[] }) => {
        if (!cancelled) {
          setEntries(body.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, refreshKey]);

  // Enrich activity rows with their concrete subtype + owner so the feed tabs
  // (Notes / Emails / Calls / Meetings / Tasks) and per-row user can work.
  useEffect(() => {
    if (!compact) return;
    let cancelled = false;
    fetch(`/api/activities?opportunityId=${opportunityId}&pageSize=50`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: { id: string; type: string; owner?: string | null }[] }) => {
        if (cancelled) return;
        const nextSubtypes = new Map<string, ActivitySubtype>();
        const nextOwners = new Map<string, string>();
        for (const a of body.data ?? []) {
          nextSubtypes.set(`activity-${a.id}`, (a.type as ActivitySubtype) ?? "Note");
          if (a.owner) nextOwners.set(`activity-${a.id}`, a.owner);
        }
        setSubtypes(nextSubtypes);
        setOwners(nextOwners);
      })
      .catch(() => {
        /* enrichment is best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, refreshKey, compact]);

  const matchesFilter = useCallback(
    (entry: TimelineEntry) => {
      if (filter === "all") return true;
      const subtype = subtypes.get(entry.id);
      switch (filter) {
        case "notes":
          return entry.type === "activity" && (subtype === "Note" || subtype === "Comment");
        case "emails":
          return entry.type === "activity" && subtype === "Email";
        case "calls":
          return entry.type === "activity" && subtype === "Call";
        case "meetings":
          return entry.type === "meeting" || (entry.type === "activity" && subtype === "Meeting");
        case "tasks":
          return entry.type === "activity" && subtype === "Task";
        default:
          return true;
      }
    },
    [filter, subtypes]
  );

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center justify-center py-6" role="status">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading timeline</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (entries.length === 0) {
    if (compact) {
      return (
        <div className="px-1 py-5 text-center">
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Log a call, email, or note with the composer below.
          </p>
        </div>
      );
    }
    return (
      <EmptyState
        title="No activity yet"
        description="Create quotes, add activities, or move stages to build the timeline."
      />
    );
  }

  if (compact) {
    const filtered = entries.filter(matchesFilter);
    const visible = limit && !expanded ? filtered.slice(0, limit) : filtered;
    const groups = COMPACT_GROUPS.map((label) => ({
      label,
      entries: visible.filter((e) => groupLabel(e.timestamp) === label),
    })).filter((group) => group.entries.length > 0);

    return (
      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="px-1 py-5 text-center">
            <p className="text-sm font-medium text-foreground">Nothing here yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Switch to the Activity tab or add an entry with the composer.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <p className="sticky top-0 z-10 -mx-1 mb-0.5 rounded-md bg-popover/90 px-1 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase backdrop-blur-sm supports-[backdrop-filter]:bg-popover/75">
                {group.label}
              </p>
              <ul>
                {group.entries.map((entry, index) => {
                  const owner = owners.get(entry.id);
                  return (
                    <li key={entry.id} className="group relative flex gap-2.5 py-1">
                      {index < group.entries.length - 1 && (
                        <span
                          className="absolute top-4 left-[3px] h-[calc(100%-12px)] w-px bg-border"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${dotColors[entry.type]}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[13px] font-medium text-foreground">{entry.title}</p>
                          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                            {timeLabel(entry.timestamp)}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.description}</p>
                        )}
                        {owner && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <UserRound className="h-2.5 w-2.5" aria-hidden="true" />
                            {owner}
                          </p>
                        )}
                      </div>
                      {onRowMore && (
                        <button
                          type="button"
                          onClick={onRowMore}
                          className="flex h-6 w-6 shrink-0 items-center justify-center self-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          aria-label="More options"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
        {limit && filtered.length > limit && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-md px-1 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Show less" : `View full history (${filtered.length})`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {entries.map((entry, index) => {
        const config = typeConfig[entry.type];
        const Icon = config.icon;
        return (
          <div key={entry.id} className="relative flex gap-3 pl-1">
            {index < entries.length - 1 && (
              <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-slate-200 dark:bg-slate-700" />
            )}
            <div className={`z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.color}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.title}</p>
              {entry.description && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{entry.description}</p>
              )}
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
