import { Suspense } from "react";

import { PageLayout } from "@/components/common/PageLayout";

import { InvoiceStats } from "./components/InvoiceStats";
import { InvoiceTable } from "./components/InvoiceTable";
import { InvoicesModuleGate } from "./components/InvoicesModuleGate";

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
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        }
      >
        <InvoicesModuleGate>
          <InvoiceStats />
          <InvoiceTable prefillOpportunityId={params.opportunityId} />
        </InvoicesModuleGate>
      </Suspense>
    </PageLayout>
  );
}
