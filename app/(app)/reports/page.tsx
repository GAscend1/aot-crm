import { PageLayout } from "@/components/common/PageLayout";

import { ReportStats } from "./components/ReportStats";
import { ReportTable } from "./components/ReportTable";

export default function ReportsPage() {
  return (
    <PageLayout
      title="Reports"
      description="Create, view, and manage business reports and analytics."
    >
      <ReportStats />

      <ReportTable />
    </PageLayout>
  );
}
