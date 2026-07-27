import { Shield, Users, Building2, UserCog } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

export function AdminStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Users"
        value="12"
        icon={Users}
      />

      <StatCard
        title="Active"
        value="9"
        icon={Shield}
      />

      <StatCard
        title="Departments"
        value="6"
        icon={Building2}
      />

      <StatCard
        title="Roles"
        value="9"
        icon={UserCog}
      />
    </div>
  );
}
