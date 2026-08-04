"use client";

import { DollarSign, Target, Briefcase, UserPlus, Percent, Users, Building2, Ticket, Clock, Receipt, FileText, type LucideIcon } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { useDashboardData } from "@/hooks/use-dashboard-data";

function getVariant(
  title: string
): "default" | "primary" | "success" | "warning" | "danger" {
  switch (title) {
    case "Won Revenue":
    case "Paid Revenue":
      return "success";
    case "Pipeline Value":
    case "Conversion Rate":
      return "primary";
    case "Open Opportunities":
    case "New Leads":
      return "warning";
    case "Open Tickets":
    case "Overdue Tasks":
      return "danger";
    case "Customers":
    case "Companies":
      return "success";
    default:
      return "default";
  }
}

export function DashboardKPIs() {
  const { kpis } = useDashboardData();

  const icons: Record<string, LucideIcon> = {
    "Won Revenue": DollarSign,
    "Pipeline Value": Target,
    "Open Opportunities": Briefcase,
    "New Leads": UserPlus,
    "Conversion Rate": Percent,
    Customers: Users,
    Companies: Building2,
    "Open Tickets": Ticket,
    Quotes: FileText,
    Invoices: Receipt,
    "Paid Revenue": DollarSign,
    "Overdue Tasks": Clock,
  };

  return (
    <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = icons[kpi.title] || Target;
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
