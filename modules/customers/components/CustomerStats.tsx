import { Building2, UserPlus, Users } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

export function CustomerStats() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCard
        title="Customers"
        value={124}
        icon={Users}
      />

      <StatCard
        title="Companies"
        value={42}
        icon={Building2}
      />

      <StatCard
        title="New This Month"
        value={12}
        icon={UserPlus}
      />
    </div>
  );
}