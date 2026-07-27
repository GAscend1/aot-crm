import { PageLayout } from "@/components/common/PageLayout";

import { CustomerStats } from "./components/CustomerStats";
import { CustomerTable } from "./components/CustomerTable";

export default function CustomersPage() {
  return (
    <PageLayout
      title="Customers"
      description="Manage customer accounts, contacts, and relationships."
    >
      <CustomerStats />

      <CustomerTable />
    </PageLayout>
  );
}
