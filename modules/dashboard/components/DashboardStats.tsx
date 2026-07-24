import {
  Building2,
  Target,
  Ticket,
  Users,
} from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

export function DashboardStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
        title="Leads"
        value={19}
        icon={Target}
      />

      <StatCard
        title="Open Tickets"
        value={8}
        icon={Ticket}
      />
    </div>
  );
}