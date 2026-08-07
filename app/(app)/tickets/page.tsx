import { PageLayout } from "@/components/common/PageLayout";

import { TicketStats } from "./components/TicketStats";
import { TicketTable } from "./components/TicketTable";
import { TicketsModuleGate } from "./components/TicketsModuleGate";

export default function TicketsPage() {
  return (
    <PageLayout
      title="Tickets"
      description="Track, manage, and resolve support tickets and issues."
    >
      <TicketsModuleGate>
        <TicketStats />

        <TicketTable />
      </TicketsModuleGate>
    </PageLayout>
  );
}
