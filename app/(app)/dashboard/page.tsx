import { PageLayout } from "@/components/common/PageLayout";

import { DashboardKPIs } from "@/modules/dashboard/components/DashboardKPIs";
import { RevenueChart } from "@/modules/dashboard/components/RevenueChart";
import { RecentActivity } from "@/modules/dashboard/components/RecentActivity";
import { RecentCustomers } from "@/modules/dashboard/components/RecentCustomers";
import { RecentCompanies } from "@/modules/dashboard/components/RecentCompanies";
import { RecentOpportunities } from "@/modules/dashboard/components/RecentOpportunities";
import { UpcomingTasks } from "@/modules/dashboard/components/UpcomingTasks";
import { QuickActions } from "@/modules/dashboard/components/QuickActions";
import { Notifications } from "@/modules/dashboard/components/Notifications";

export default function DashboardPage() {
  return (
    <PageLayout
      title="Dashboard"
      description="Overview of your CRM activity."
    >
      <DashboardKPIs />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <Notifications />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <QuickActions />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <RecentCustomers />
        <RecentCompanies />
        <RecentOpportunities />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingTasks />
        </div>
      </div>
    </PageLayout>
  );
}
