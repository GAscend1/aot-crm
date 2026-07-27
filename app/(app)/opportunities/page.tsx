import { PageLayout } from "@/components/common/PageLayout";

import { OpportunityStats } from "./components/OpportunityStats";
import { OpportunityTable } from "./components/OpportunityTable";

export default function OpportunitiesPage() {
  return (
    <PageLayout
      title="Opportunities"
      description="Track and manage sales opportunities, deals, and pipeline activities."
    >
      <OpportunityStats />

      <OpportunityTable />
    </PageLayout>
  );
}
