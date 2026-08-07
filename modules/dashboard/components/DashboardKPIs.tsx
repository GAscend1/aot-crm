"use client";

import { DollarSign, Target, Briefcase, Percent, Clock, TrendingUp, type LucideIcon } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";

function getVariant(
  title: string
): "default" | "primary" | "success" | "warning" | "danger" {
  switch (title) {
    case "Won Revenue":
      return "success";
    case "Pipeline Value":
    case "Forecast Revenue":
    case "Win Rate":
      return "primary";
    case "Open Opportunities":
      return "warning";
    case "Overdue Activities":
      return "danger";
    default:
      return "default";
  }
}

export function DashboardKPIs() {
  const { kpis } = useDashboardData();

  const icons: Record<string, LucideIcon> = {
    "Won Revenue": DollarSign,
    "Pipeline Value": Target,
    "Forecast Revenue": TrendingUp,
    "Open Opportunities": Briefcase,
    "Win Rate": Percent,
    "Overdue Activities": Clock,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = icons[kpi.title] || Target;
        return (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={Icon}
            variant={getVariant(kpi.title)}
            trend={
              kpi.change === null
                ? undefined
                : {
                    value: `${Math.abs(kpi.change)}%`,
                    positive: kpi.change >= 0,
                  }
            }
          />
        );
      })}
    </div>
  );
}
