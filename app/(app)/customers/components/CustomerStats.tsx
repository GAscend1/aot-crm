import { Users, UserCheck, Target, UserPlus } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

import { customers } from "../data";

export function CustomerStats() {
  const total = customers.length;
  const active = customers.filter((c) => c.status === "Active").length;
  const prospects = customers.filter((c) => c.status === "Prospect").length;

  const now = new Date();
  const newThisMonth = customers.filter((c) => {
    const created = new Date(c.createdAt);
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Customers"
        value={total}
        icon={Users}
      />

      <StatCard
        title="Active"
        value={active}
        icon={UserCheck}
      />

      <StatCard
        title="Prospects"
        value={prospects}
        icon={Target}
      />

      <StatCard
        title="New This Month"
        value={newThisMonth}
        icon={UserPlus}
      />
    </div>
  );
}
