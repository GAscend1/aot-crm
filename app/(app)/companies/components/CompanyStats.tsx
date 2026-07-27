import { Banknote, Building2, Globe, Users } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

export function CompanyStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Companies"
        value="12"
        icon={Building2}
      />

      <StatCard
        title="Active"
        value="9"
        icon={Users}
      />

      <StatCard
        title="Industries"
        value="6"
        icon={Globe}
      />

      <StatCard
        title="Total Revenue"
        value="$27.1B"
        icon={Banknote}
      />
    </div>
  );
}
