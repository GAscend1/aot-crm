"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { Button } from "@/components/ui/button";

type ViewType = "month" | "week" | "day";

const events = [
  { id: "1", title: "Team Standup", date: "2026-07-28", time: "09:00", type: "meeting" },
  { id: "2", title: "Client Call - Acme Corp", date: "2026-07-28", time: "11:00", type: "call" },
  { id: "3", title: "Q3 Planning Session", date: "2026-07-29", time: "14:00", type: "meeting" },
  { id: "4", title: "Follow up with TechStart", date: "2026-07-30", time: "10:30", type: "task" },
  { id: "5", title: "Revenue Review", date: "2026-07-31", time: "15:00", type: "meeting" },
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 28));
  const [view, setView] = useState<ViewType>("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  const getEventsForDay = (day: number) =>
    events.filter((e) => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

  return (
    <PageLayout title="Calendar" description="View and manage your schedule.">
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
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(2026, 6, 28))}>
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
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Event
          </Button>
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
            const isToday =
              day === 28 && month === 6 && year === 2026;

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
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="truncate rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
