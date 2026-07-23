import { PageHeader } from "@/components/common/PageHeader";

import { DashboardStats } from "@/modules/dashboard/components/DashboardStats";
import { RecentActivity } from "@/modules/dashboard/components/RecentActivity";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your CRM activity."
      />

      <DashboardStats />

      <RecentActivity />
    </div>
  );
}