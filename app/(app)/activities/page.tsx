import { Suspense } from "react";

import { PageLayout } from "@/components/common/PageLayout";
import { ActivitiesView } from "./components/ActivitiesView";

export default function ActivitiesPage() {
  return (
    <PageLayout
      title="Activities"
      description="One work engine for calls, emails, meetings, tasks, and reminders — switch between timeline, calendar, tasks, meetings, and email views."
    >
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        }
      >
        <ActivitiesView />
      </Suspense>
    </PageLayout>
  );
}
