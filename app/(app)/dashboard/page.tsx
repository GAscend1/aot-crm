import { PageLayout } from "@/components/common/PageLayout";
import { getCrmUser } from "@/lib/server/api";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/server/dashboard-data";

import { DashboardDataProvider } from "@/hooks/use-dashboard-data";
import { DashboardKPIs } from "@/modules/dashboard/components/DashboardKPIs";
import { RevenueChart } from "@/modules/dashboard/components/RevenueChart";
import { OwnerPerformance } from "@/modules/dashboard/components/OwnerPerformance";
import { LazyPipelineByStage } from "@/modules/dashboard/components/LazyPipelineByStage";
import { UpcomingMeetings } from "@/modules/dashboard/components/UpcomingMeetings";
import { RecentOpportunities } from "@/modules/dashboard/components/RecentOpportunities";
import { UpcomingTasks } from "@/modules/dashboard/components/UpcomingTasks";
import { QuickActions } from "@/modules/dashboard/components/QuickActions";
import { GettingStarted } from "@/modules/dashboard/components/GettingStarted";

export const dynamic = "force-dynamic";

/**
 * Analytics-first dashboard — deliberately compact:
 *
 * 1. Six sales KPIs (Pipeline Value, Forecast Revenue, Won Revenue,
 *    Open Opportunities, Win Rate, Overdue Activities)
 * 2. Pipeline by Stage + Revenue trend
 * 3. Upcoming Activities (meetings + tasks) and Recent Opportunities
 * 4. Side column: Quick Actions + Top Reps (+ Getting Started for new users)
 *
 * Customer/company health, owner productivity deep-dives, and the full revenue
 * forecast live in /reports — they are NOT repeated here.
 */
export default async function DashboardPage() {
  // SSR prefetch → hydrated into the shared query cache so the dashboard
  // widgets render instantly and only one client poll keeps them fresh.
  const user = await getCrmUser();
  if (!user) redirect("/login");
  const initialData = await getDashboardData(user.organizationId);

  return (
    <PageLayout title="Dashboard" description="Overview of your CRM activity.">
      <DashboardDataProvider initialData={initialData}>
        <DashboardKPIs />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LazyPipelineByStage />
          </div>
          <RevenueChart />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="grid gap-5 md:grid-cols-2">
              <UpcomingMeetings />
              <UpcomingTasks />
            </div>
            <RecentOpportunities />
          </div>
          <div className="space-y-5">
            <GettingStarted />
            <QuickActions />
            <OwnerPerformance />
          </div>
        </div>
      </DashboardDataProvider>
    </PageLayout>
  );
}
