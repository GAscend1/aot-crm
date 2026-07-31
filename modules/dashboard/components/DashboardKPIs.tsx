"use client";

import { DollarSign, Users, Building2, Briefcase, Ticket, type LucideIcon } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";

function getVariant(
  title: string
): "default" | "primary" | "success" | "warning" | "danger" {
  switch (title) {
    case "Total Revenue":
    case "Revenue":
      return "primary";
    case "Customers":
    case "Companies":
      return "success";
    case "Opportunities":
      return "warning";
    case "Open Tickets":
      return "danger";
    default:
      return "default";
  }
}

export function DashboardKPIs() {
  const { kpis } = useDashboardData();

  const icons: Record<string, LucideIcon> = {
    "Total Revenue": DollarSign,
    Customers: Users,
    Companies: Building2,
    Opportunities: Briefcase,
    "Open Tickets": Ticket,
  };

  return (
    <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = icons[kpi.title] || DollarSign;
        return (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={Icon}
            variant={getVariant(kpi.title)}
            trend={{
              value: `${Math.abs(kpi.change)}%`,
              positive: kpi.change >= 0,
            }}
          />
        );
      })}
    </div>
  );
}
