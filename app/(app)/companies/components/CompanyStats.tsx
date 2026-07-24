import { Building2, Globe, Handshake, Users } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";

export function CompanyStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Companies"
        value="248"
        icon={Building2}
      />

      <StatCard
        title="Partners"
        value="38"
        icon={Handshake}
      />

      <StatCard
        title="Industries"
        value="16"
        icon={Globe}
      />

      <StatCard
        title="Employees"
        value="1.2M"
        icon={Users}
      />
    </div>
  );
}