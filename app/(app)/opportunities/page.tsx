import { Suspense } from "react";

import { PageLayout } from "@/components/common/PageLayout";
import { OpportunitiesView } from "./components/OpportunitiesView";

export default function OpportunitiesPage() {
  return (
    <PageLayout
      title="Opportunities"
      description="Track and manage sales opportunities — switch between list, kanban pipeline, and forecast views."
    >
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        }
      >
        <OpportunitiesView />
      </Suspense>
    </PageLayout>
  );
}
