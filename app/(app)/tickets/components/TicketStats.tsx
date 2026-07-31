"use client";

import { AlertCircle, CheckCircle2, Clock, Inbox } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

type TicketRow = {
  status: string;
  priority: string;
};

export function TicketStats() {
  const { data, loading } = useApiList<TicketRow>("/api/tickets?pageSize=1000");

  const openCount = data.filter((t) => t.status === "Open").length;
  const criticalCount = data.filter((t) => t.priority === "Critical").length;
  const inProgressCount = data.filter((t) => t.status === "In Progress").length;
  const resolvedCount = data.filter((t) => t.status === "Resolved").length;
  const total = data.length;
  const resolutionRate = total ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Open Tickets" value={loading ? "…" : openCount} icon={Inbox} />
      <StatCard title="Critical" value={loading ? "…" : criticalCount} icon={AlertCircle} />
      <StatCard title="In Progress" value={loading ? "…" : inProgressCount} icon={Clock} />
      <StatCard
        title="Resolution Rate"
        value={loading ? "…" : `${resolutionRate}%`}
        icon={CheckCircle2}
      />
    </div>
  );
}
