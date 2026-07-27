import { AlertCircle, CheckCircle2, Clock, Inbox } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

import { tickets } from "../data";

export function TicketStats() {
  const openCount = tickets.filter((t) => t.status === "Open").length;
  const criticalCount = tickets.filter((t) => t.priority === "Critical").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;
  const total = tickets.length;
  const resolutionRate = total ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Open Tickets"
        value={openCount}
        icon={Inbox}
      />

      <StatCard
        title="Critical"
        value={criticalCount}
        icon={AlertCircle}
      />

      <StatCard
        title="In Progress"
        value={inProgressCount}
        icon={Clock}
      />

      <StatCard
        title="Resolution Rate"
        value={`${resolutionRate}%`}
        icon={CheckCircle2}
      />
    </div>
  );
}
