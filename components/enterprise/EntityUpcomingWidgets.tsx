"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, Circle, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EntityTask {
  id: string;
  subject: string;
  dueDate: string;
  status: string;
  priority?: string;
  owner?: string;
}

export interface EntityMeeting {
  id: string;
  subject: string;
  dueDate: string;
  status: string;
  owner?: string;
}

export function UpcomingMeetingsWidget({ meetings }: { meetings: EntityMeeting[] }) {
  return (
    <section className="rounded-xl border bg-surface-raised">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">
          Upcoming Meetings
          {meetings.length > 0 && <span className="ml-1 text-muted-foreground">({meetings.length})</span>}
        </h3>
      </div>
      {meetings.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No upcoming meetings.</p>
      ) : (
        <div className="divide-y">
          {meetings.map((m) => (
            <div key={m.id} className="flex items-start gap-3 px-4 py-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--chart-3)]/[0.12] text-[color:var(--chart-3)]">
                <Video className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{m.subject}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  {m.dueDate ? new Date(m.dueDate).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "No date"}
                  {m.owner ? ` · ${m.owner}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function OpenTasksWidget({ tasks }: { tasks: EntityTask[] }) {
  // Captured once per mount so overdue evaluation stays pure during renders.
  const [now] = useState(() => Date.now());
  const active = tasks.filter((t) => t.status !== "Completed");
  return (
    <section className="rounded-xl border bg-surface-raised">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">
          Open Tasks
          {active.length > 0 && <span className="ml-1 text-muted-foreground">({active.length})</span>}
        </h3>
      </div>
      {active.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No open tasks.</p>
      ) : (
        <div className="divide-y">
          {active.map((t) => {
            const overdue = t.dueDate ? new Date(t.dueDate).getTime() < now : false;
            return (
              <div key={t.id} className="flex items-start gap-3 px-4 py-2.5">
                {overdue ? (
                  <Circle className="mt-1 h-4 w-4 shrink-0 text-[color:var(--danger)]" />
                ) : (
                  <Circle className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", overdue ? "font-medium text-[color:var(--danger)]" : "text-foreground")}>
                    {t.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {overdue ? (
                      <span className="font-medium text-[color:var(--danger)]">Overdue</span>
                    ) : t.dueDate ? (
                      <>Due {new Date(t.dueDate).toLocaleDateString()}</>
                    ) : (
                      "No due date"
                    )}
                    {t.owner ? ` · ${t.owner}` : ""}
                  </p>
                </div>
                {t.status === "Completed" ? (
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[color:var(--success)]" />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
