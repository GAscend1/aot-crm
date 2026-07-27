import { Users, UserCheck, Building2, UserPlus } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

export function ContactStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Contacts"
        value="248"
        icon={Users}
      />

      <StatCard
        title="Active"
        value="192"
        icon={UserCheck}
      />

      <StatCard
        title="Companies Represented"
        value="64"
        icon={Building2}
      />

      <StatCard
        title="New This Month"
        value="18"
        icon={UserPlus}
      />
    </div>
  );
}
