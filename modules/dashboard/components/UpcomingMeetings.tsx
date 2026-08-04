"use client";

import { CalendarClock, Video } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const dayLabel = sameDay(d, today)
    ? "Today"
    : sameDay(d, tomorrow)
      ? "Tomorrow"
      : d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return `${dayLabel} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export function UpcomingMeetings() {
  const { upcomingMeetings } = useDashboardData();

  if (upcomingMeetings.length === 0) {
    return (
      <SectionCard title="Upcoming Meetings">
        <EmptyState
          compact
          title="No upcoming meetings"
          description="Planned meetings will appear here."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Upcoming Meetings">
      <div className="-mx-4 -mb-4">
        {upcomingMeetings.map((meeting, index) => (
          <div
            key={meeting.id}
            className={`flex items-start gap-3 px-4 py-3 ${
              index < upcomingMeetings.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Video className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{meeting.subject}</p>
              <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(meeting.dueDate)}</p>
              {meeting.related && (
                <p className="mt-0.5 truncate text-xs text-slate-400">{meeting.related}</p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-400">
              <CalendarClock className="h-3 w-3" />
              {meeting.assignee || "Unassigned"}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
