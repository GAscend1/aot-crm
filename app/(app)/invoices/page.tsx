import { PageLayout } from "@/components/common/PageLayout";

import { InvoiceStats } from "./components/InvoiceStats";
import { InvoiceTable } from "./components/InvoiceTable";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageLayout
      title="Invoices"
      description="Manage invoices, billing, and revenue collection."
    >
      <InvoiceStats />
      <InvoiceTable prefillOpportunityId={params.opportunityId} />
    </PageLayout>
  );
}
