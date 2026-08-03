"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { Button } from "@/components/ui/button";
import { EventModal } from "@/components/integrations/EventModal";
import { IntegrationWarning } from "@/components/common/IntegrationWarning";
import { calendarService } from "@/services/calendar.service";
import type { CalendarEvent } from "@/types/common";

type ViewType = "month" | "week" | "day";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
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
    <PageLayout
      title="Calendar"
      description="View and manage your schedule."
      actions={
        <Button size="sm" onClick={handleAddEvent}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Event
        </Button>
      }
    >
      {pendingConsent && (
        <IntegrationWarning
          title="Microsoft Calendar is awaiting approval"
          message="Your Microsoft 365 connection is waiting for administrator approval. Calendar events can't sync right now, but the rest of the CRM keeps working."
          onDismiss={() => setPendingConsent(false)}
        />
      )}
      <div className="flex items-center justify-between rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {monthNames[month]} {year}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5 dark:border-slate-700">
            {(["month", "week", "day"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  view === v
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
        <div className="grid grid-cols-7 border-b dark:border-slate-700">
          {dayNames.map((day) => (
            <div
              key={day}
              className="px-3 py-2 text-center text-xs font-semibold uppercase text-slate-500"
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
                className={`min-h-[100px] border-b border-r p-2 dark:border-slate-700 ${
                  day ? "hover:bg-slate-50 dark:hover:bg-slate-800/50" : "bg-slate-50/50 dark:bg-slate-900"
                }`}
              >
                {day && (
                  <>
                    <div
                      className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday
                          ? "bg-blue-600 font-semibold text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((event) => {
                        const colorMap: Record<string, string> = {
                          team: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
                          meeting: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                          call: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                          task: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
                          default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        };
                        const hasTeams = event.onlineMeeting?.provider === "teams";
                        const color = hasTeams ? "team" : "meeting";

                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-left ${colorMap[color] || colorMap.default}`}
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
    </PageLayout>
  );
}
