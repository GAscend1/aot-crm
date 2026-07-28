"use client";

import { Users, Briefcase, Ticket, Target, CheckSquare } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useLive } from "@/hooks/use-live";
import { synchronizedActivityService } from "@/services/synchronized-activity.service";
import { Events } from "@/services/events";

const typeIcons = {
  customer: Users,
  opportunity: Briefcase,
  ticket: Ticket,
  lead: Target,
  task: CheckSquare,
} as const;

const typeColors = {
  customer: "bg-blue-100 text-blue-600",
  opportunity: "bg-amber-100 text-amber-600",
  ticket: "bg-purple-100 text-purple-600",
  lead: "bg-green-100 text-green-600",
  task: "bg-slate-100 text-slate-600",
} as const;

export function RecentActivity() {
  const { data: activities } = useLive(
    () => synchronizedActivityService.getRecent(10),
    [
      Events.ACTIVITY_CREATED,
      Events.CUSTOMER_CREATED, Events.CUSTOMER_UPDATED,
      Events.CONTACT_CREATED, Events.CONTACT_UPDATED,
      Events.OPPORTUNITY_CREATED, Events.OPPORTUNITY_UPDATED, Events.OPPORTUNITY_WON, Events.OPPORTUNITY_LOST,
      Events.EMAIL_SENT, Events.EMAIL_DRAFT_SAVED, Events.EMAIL_FAILED,
      Events.TEAMS_MEETING_CREATED,
      Events.ZOOM_MEETING_CREATED,
      Events.CALENDAR_EVENT_CREATED,
      Events.NOTE_ADDED,
      Events.TASK_CREATED, Events.TASK_COMPLETED,
      Events.CALL_CREATED, Events.CALL_COMPLETED,
    ],
    []
  );

  if (activities.length === 0) {
    return (
      <SectionCard title="Recent Activity">
        <EmptyState
          title="No activity yet"
          description="Recent CRM activity will appear here once users begin interacting with the system."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Activity">
      <div className="-mx-6 -mb-6">
        {activities.map((activity, index) => {
          const Icon = typeIcons[activity.entityType as keyof typeof typeIcons] || CheckSquare;

          return (
            <div
              key={activity.id}
              className={`flex gap-4 px-6 py-4 ${
                index < activities.length - 1
                  ? "border-b border-slate-100"
                  : ""
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  typeColors[activity.entityType as keyof typeof typeColors] || "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{activity.summary}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span>{activity.userName}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
