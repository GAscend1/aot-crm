"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventModal } from "@/components/integrations/EventModal";
import { IntegrationWarning } from "@/components/common/IntegrationWarning";
import { calendarService } from "@/services/calendar.service";
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
  const [pendingConsent, setPendingConsent] = useState(false);

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
        setPendingConsent(false);
      })
      .catch((err: unknown) => {
        setEvents([]);
        if (err instanceof Error && err.message.includes("awaiting administrator approval")) {
          setPendingConsent(true);
        }
      });
  }, [monthStart, monthEnd]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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
      {pendingConsent && (
        <IntegrationWarning
          title="Microsoft Calendar is awaiting approval"
          message="Your Microsoft 365 connection is waiting for administrator approval. Calendar events can't sync right now, but the rest of the CRM keeps working."
          onDismiss={() => setPendingConsent(false)}
        />
      )}

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
                            className={cn(
                              "w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium",
                              color
                            )}
                          >
                            {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                            {event.subject}
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
