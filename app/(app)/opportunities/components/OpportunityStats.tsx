import { DollarSign, TrendingUp, BarChart3, Target } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

import { opportunities } from "../data";

export function OpportunityStats() {
  const totalValue = opportunities.reduce(
    (sum, o) => sum + (o.status === "Open" ? o.value : 0),
    0
  );
  const openDeals = opportunities.filter((o) => o.status === "Open").length;
  const wonThisQuarter = opportunities.filter(
    (o) =>
      o.status === "Won" &&
      o.expectedCloseDate >= "2026-07-01" &&
      o.expectedCloseDate <= "2026-09-30"
  );
  const wonValue = wonThisQuarter.reduce((sum, o) => sum + o.value, 0);
  const avgDealSize = Math.round(
    opportunities.reduce((sum, o) => sum + o.value, 0) /
      opportunities.length
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Pipeline Value"
        value={`$${(totalValue / 1000).toFixed(0)}K`}
        icon={DollarSign}
      />

      <StatCard
        title="Open Deals"
        value={openDeals}
        icon={TrendingUp}
      />

      <StatCard
        title="Won This Quarter"
        value={`$${(wonValue / 1000).toFixed(0)}K`}
        icon={Target}
      />

      <StatCard
        title="Avg Deal Size"
        value={`$${(avgDealSize / 1000).toFixed(0)}K`}
        icon={BarChart3}
      />
    </div>
  );
}
