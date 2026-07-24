import { PageHeader } from "@/components/common/PageHeader";

import { CustomerStats } from "@/modules/customers/components/CustomerStats";
import { CustomerToolbar } from "@/modules/customers/components/CustomerToolbar";
import { CustomerTable } from "@/modules/customers/components/CustomerTable";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer accounts and relationships."
      />

      <CustomerStats />

      <CustomerToolbar />

      <CustomerTable />
    </div>
  );
}