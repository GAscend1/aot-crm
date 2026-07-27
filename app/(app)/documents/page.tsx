import { PageLayout } from "@/components/common/PageLayout";

import { DocumentStats } from "./components/DocumentStats";
import { DocumentTable } from "./components/DocumentTable";

export default function DocumentsPage() {
  return (
    <PageLayout
      title="Documents"
      description="Manage files, contracts, proposals, reports, and other business documents."
    >
      <DocumentStats />

      <DocumentTable />
    </PageLayout>
  );
}