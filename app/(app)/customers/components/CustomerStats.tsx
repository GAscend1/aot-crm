"use client";

import { Users, UserCheck, Target, UserPlus } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

type CustomerRow = {
  status: string;
  createdAt: string;
};

export function CustomerStats() {
  const { data, loading } = useApiList<CustomerRow>("/api/customers?pageSize=1000");

  const total = data.length;
  const active = data.filter((c) => c.status === "Active").length;
  const prospects = data.filter((c) => c.status === "Prospect").length;

  const now = new Date();
  const newThisMonth = data.filter((c) => {
    const created = new Date(c.createdAt);
    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Customers" value={loading ? "…" : total} icon={Users} />
      <StatCard title="Active" value={loading ? "…" : active} icon={UserCheck} />
      <StatCard title="Prospects" value={loading ? "…" : prospects} icon={Target} />
      <StatCard title="New This Month" value={loading ? "…" : newThisMonth} icon={UserPlus} />
    </div>
  );
}
