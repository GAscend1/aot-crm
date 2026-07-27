import { Target, TrendingUp, Users, Wallet } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

import { leads } from "../data";

export function LeadStats() {
  const total = leads.length;
  const qualified = leads.filter((l) => l.status === "Qualified").length;
  const won = leads.filter((l) => l.status === "Closed Won").length;
  const conversionRate = total > 0 ? `${Math.round((won / total) * 100)}%` : "0%";
  const totalRevenue = leads.reduce((sum, l) => sum + l.expectedRevenue, 0);

  const formattedRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalRevenue);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Leads"
        value={total}
        icon={Users}
      />

      <StatCard
        title="Qualified"
        value={qualified}
        icon={Target}
      />

      <StatCard
        title="Conversion Rate"
        value={conversionRate}
        icon={TrendingUp}
      />

      <StatCard
        title="Expected Revenue"
        value={formattedRevenue}
        icon={Wallet}
      />
    </div>
  );
}
