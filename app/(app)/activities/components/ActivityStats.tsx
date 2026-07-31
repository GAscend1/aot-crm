"use client";

import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ListChecks,
} from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

type ActivityRow = {
  date: string;
  status: string;
};

export function ActivityStats() {
  const { data, loading } = useApiList<ActivityRow>("/api/activities?pageSize=1000");

  const today = new Date().toISOString().split("T")[0];
  const total = data.length;
  const completedToday = data.filter(
    (a) => a.date === today && a.status === "Completed"
  ).length;
  const upcoming = data.filter(
    (a) => a.date > today && a.status !== "Cancelled"
  ).length;
  const overdue = data.filter(
    (a) => a.date < today && a.status !== "Completed" && a.status !== "Cancelled"
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Activities" value={loading ? "…" : total} icon={ListChecks} />
      <StatCard title="Completed Today" value={loading ? "…" : completedToday} icon={CheckCircle2} />
      <StatCard title="Upcoming" value={loading ? "…" : upcoming} icon={CalendarCheck} />
      <StatCard title="Overdue" value={loading ? "…" : overdue} icon={AlertCircle} />
    </div>
  );
}
