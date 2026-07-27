import { PageLayout } from "@/components/common/PageLayout";

import { CompanyStats } from "./components/CompanyStats";
import { CompanyTable } from "./components/CompanyTable";

export default function CompaniesPage() {
  return (
    <PageLayout
      title="Companies"
      description="Manage customer organizations, business partners, and corporate accounts."
    >
      <CompanyStats />

      <CompanyTable />
    </PageLayout>
  );
}
