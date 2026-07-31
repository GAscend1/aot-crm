"use client";

import { Target, TrendingUp, Users, Wallet } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

type LeadRow = {
  status: string;
  expectedRevenue: number;
};

export function LeadStats() {
  const { data, loading } = useApiList<LeadRow>("/api/leads?pageSize=1000");

  const total = data.length;
  const qualified = data.filter((l) => l.status === "Qualified").length;
  const won = data.filter((l) => l.status === "Closed Won").length;
  const conversionRate = total > 0 ? `${Math.round((won / total) * 100)}%` : "0%";
  const totalRevenue = data.reduce((sum, l) => sum + (l.expectedRevenue || 0), 0);

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalRevenue);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Leads" value={loading ? "…" : total} icon={Users} />
      <StatCard title="Qualified" value={loading ? "…" : qualified} icon={Target} />
      <StatCard title="Conversion Rate" value={loading ? "…" : conversionRate} icon={TrendingUp} />
      <StatCard title="Expected Revenue" value={loading ? "…" : formattedRevenue} icon={Wallet} />
    </div>
  );
}
