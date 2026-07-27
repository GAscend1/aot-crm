import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ListChecks,
} from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

import { activities } from "../data";

const today = "2026-07-27";

export function ActivityStats() {
  const total = activities.length;
  const completedToday = activities.filter(
    (a) => a.date === today && a.status === "Completed"
  ).length;
  const upcoming = activities.filter(
    (a) => a.date > today && a.status !== "Cancelled"
  ).length;
  const overdue = activities.filter(
    (a) => a.date < today && a.status !== "Completed" && a.status !== "Cancelled"
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Activities" value={total} icon={ListChecks} />

      <StatCard
        title="Completed Today"
        value={completedToday}
        icon={CheckCircle2}
      />

      <StatCard title="Upcoming" value={upcoming} icon={CalendarCheck} />

      <StatCard title="Overdue" value={overdue} icon={AlertCircle} />
    </div>
  );
}
