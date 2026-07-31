"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export type TimelineEntry = {
  id: string;
  type: "created" | "stage" | "activity" | "quote" | "invoice" | "document" | "meeting" | "assignment" | "audit";
  title: string;
  description: string;
  timestamp: string;
};

interface OpportunityTimelineProps {
  opportunityId: string;
  refreshKey?: number;
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

export function OpportunityTimeline({ opportunityId, refreshKey = 0 }: OpportunityTimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Create quotes, add activities, or move stages to build the timeline."
      />
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
