import { PageLayout } from "@/components/common/PageLayout";

import { LeadStats } from "./components/LeadStats";
import { LeadTable } from "./components/LeadTable";

export default function LeadsPage() {
  return (
    <PageLayout
      title="Leads"
      description="Track and manage potential sales opportunities through the pipeline."
    >
      <LeadStats />

      <LeadTable />
    </PageLayout>
  );
}
