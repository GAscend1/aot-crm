"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Cloud, CloudOff, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventModal } from "@/components/integrations/EventModal";
import { IntegrationStateBanner } from "@/components/common/IntegrationStateBanner";
import { calendarService, type CalendarSyncStatus } from "@/services/calendar.service";
import { classifyGraphError, type IntegrationStatus } from "@/services/integration-gate";
import type { CalendarEvent } from "@/types/common";
import { cn } from "@/lib/utils";

type ViewType = "month" | "week" | "day";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Calendar view of the Activities module (merged from the old /activities/calendar
 * page). Calendar is a date-based view of the same work engine as activities.
 */
export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [integrationIssue, setIntegrationIssue] = useState<IntegrationStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthStart = useMemo(() => {
    const d = new Date(year, month, 1);
    return d.toISOString().slice(0, 10);
  }, [year, month]);

  const monthEnd = useMemo(() => {
    const d = new Date(year, month + 1, 0, 23, 59, 59);
    return d.toISOString();
  }, [year, month]);

  const loadEvents = useCallback(() => {
    calendarService
      .getEvents(monthStart, monthEnd)
      .then((result) => {
        setEvents(result);
        setIntegrationIssue(null);
      })
      .catch((err: unknown) => {
        setEvents([]);
        setIntegrationIssue(classifyGraphError(err));
      });
  }, [monthStart, monthEnd]);

  const loadSyncStatus = useCallback(() => {
    calendarService.getSyncStatus().then(setSyncStatus);
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await calendarService.syncNow();
      if (result.ok && result.pulled && result.pulled.imported + result.pulled.updated + result.pulled.removed > 0) {
        loadEvents();
      }
      if (result.error) {
        setIntegrationIssue(
          classifyGraphError(new Error(result.error))
        );
      }
    } finally {
      setSyncing(false);
      loadSyncStatus();
    }
  }, [loadEvents, loadSyncStatus]);

  useEffect(() => {
    let cancelled = false;
    loadEvents();
    // Background sync on mount: pull Microsoft 365 changes and flush retries.
    // setState happens inside the promise callbacks, so the effect stays free
    // of synchronous state updates.
    calendarService
      .syncNow()
      .then((result) => {
        if (cancelled) return;
        if (result.ok && result.pulled && result.pulled.imported + result.pulled.updated + result.pulled.removed > 0) {
          loadEvents();
        }
        if (result.error) {
          setIntegrationIssue(classifyGraphError(new Error(result.error)));
        }
      })
      .finally(() => {
        if (!cancelled) loadSyncStatus();
      });
    // Refresh sync status periodically while the calendar is open.
    const interval = setInterval(loadSyncStatus, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadEvents, loadSyncStatus]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: number) =>
    events.filter((e) => {
      const d = new Date(e.start);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {integrationIssue && (
        <IntegrationStateBanner
          status={integrationIssue}
          onRetry={handleSync}
          onDismiss={() => setIntegrationIssue(null)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-surface-raised p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {syncStatus?.lastSyncAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 font-medium text-[color:var(--success)]">
              <Cloud className="h-3.5 w-3.5" />
              Synced {formatRelative(new Date(syncStatus.lastSyncAt))}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
              <CloudOff className="h-3.5 w-3.5" />
              Outlook sync not started
            </span>
          )}
          {syncStatus && syncStatus.errorEvents > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 font-medium text-[color:var(--danger)]">
              <AlertCircle className="h-3.5 w-3.5" />
              {syncStatus.errorEvents} sync error{syncStatus.errorEvents > 1 ? "s" : ""}
            </span>
          )}
          {syncStatus && syncStatus.pendingJobs > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 font-medium text-[color:var(--warning)]">
              <RefreshCw className="h-3.5 w-3.5" />
              {syncStatus.pendingJobs} queued
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleSync()} disabled={syncing}>
          {syncing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
          {syncing ? "Syncing…" : "Sync now"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-surface-raised p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold text-foreground">
            {monthNames[month]} {year}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleAddEvent}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Event
          </Button>
          <div className="flex rounded-lg border p-0.5">
            {(["month", "week", "day"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  view === v
                    ? "bg-[color:var(--primary)] text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-surface-raised shadow-sm">
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-center text-xs font-semibold uppercase text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const today = new Date();
            const isToday =
              day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] border-b border-r p-2 last:border-r-0",
                  day
                    ? "hover:bg-muted/50"
                    : "bg-muted/30"
                )}
              >
                {day && (
                  <>
                    <div
                      className={cn(
                        "mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm",
                        isToday
                          ? "bg-[color:var(--primary)] font-semibold text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((event) => {
                        const hasTeams = event.onlineMeeting?.provider === "teams";
                        const color = hasTeams
                          ? "bg-[color:var(--chart-5)]/[0.12] text-[color:var(--chart-5)]"
                          : "bg-info-soft text-[color:var(--info)]";

                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            title={event.syncError ? `Sync issue: ${event.syncError}` : undefined}
                            className={cn(
                              "group flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[10px] font-medium",
                              color,
                              event.graphSyncStatus === "ERROR" && "ring-1 ring-inset ring-[color:var(--danger)]/40"
                            )}
                          >
                            {event.graphSyncStatus === "ERROR" && (
                              <AlertCircle className="h-2.5 w-2.5 shrink-0 text-[color:var(--danger)]" aria-label="Sync error" />
                            )}
                            <span className="truncate">
                              {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                              {event.subject}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <EventModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEvent(null); }}
        event={selectedEvent}
        onSaved={() => { loadEvents(); setModalOpen(false); setSelectedEvent(null); }}
      />
    </div>
  );
}

function formatRelative(iso: Date): string {
  const diff = Date.now() - iso.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return iso.toLocaleDateString();
}
