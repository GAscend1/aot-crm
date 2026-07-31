import { PageLayout } from "@/components/common/PageLayout";

import { QuoteStats } from "./components/QuoteStats";
import { QuoteTable } from "./components/QuoteTable";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string; leadId?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageLayout
      title="Quotes"
      description="Create, send, and manage sales quotes and proposals."
    >
      <QuoteStats />
      <QuoteTable
        prefillOpportunityId={params.opportunityId}
        prefillLeadId={params.leadId}
      />
    </PageLayout>
  );
}
