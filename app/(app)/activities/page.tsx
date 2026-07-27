import { PageLayout } from "@/components/common/PageLayout";

import { ActivityStats } from "./components/ActivityStats";
import { ActivityTable } from "./components/ActivityTable";

export default function ActivitiesPage() {
  return (
    <PageLayout
      title="Activities"
      description="Track meetings, calls, emails, tasks, and reminders."
    >
      <ActivityStats />

      <ActivityTable />
    </PageLayout>
  );
}
