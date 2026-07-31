"use client";

import { DollarSign, TrendingUp, BarChart3, Target } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

type OpportunityRow = {
  value: number;
  status: string;
  expectedCloseDate: string;
};

export function OpportunityStats() {
  const { data, loading } = useApiList<OpportunityRow>("/api/opportunities?pageSize=1000");

  const totalValue = data.reduce(
    (sum, o) => sum + (o.status === "Open" ? o.value : 0),
    0
  );
  const openDeals = data.filter((o) => o.status === "Open").length;
  const wonThisQuarter = data.filter(
    (o) =>
      o.status === "Won" &&
      o.expectedCloseDate >= "2026-07-01" &&
      o.expectedCloseDate <= "2026-09-30"
  );
  const wonValue = wonThisQuarter.reduce((sum, o) => sum + o.value, 0);
  const avgDealSize = data.length
    ? Math.round(data.reduce((sum, o) => sum + o.value, 0) / data.length)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Pipeline Value"
        value={loading ? "…" : `$${(totalValue / 1000).toFixed(0)}K`}
        icon={DollarSign}
      />

      <StatCard title="Open Deals" value={loading ? "…" : openDeals} icon={TrendingUp} />

      <StatCard
        title="Won This Quarter"
        value={loading ? "…" : `$${(wonValue / 1000).toFixed(0)}K`}
        icon={Target}
      />

      <StatCard
        title="Avg Deal Size"
        value={loading ? "…" : `$${(avgDealSize / 1000).toFixed(0)}K`}
        icon={BarChart3}
      />
    </div>
  );
}
