import { ModulePage } from "@/components/common/ModulePage";

import { CompanyStats } from "./components/CompanyStats";
import { CompanyToolbar } from "./components/CompanyToolbar";
import { CompanyTable } from "./components/CompanyTable";

export default function CompaniesPage() {
  return (
    <ModulePage>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Companies
        </h1>

        <p className="text-muted-foreground">
          Manage customer organizations, business partners, and corporate
          accounts.
        </p>
      </div>

      <CompanyStats />

      <CompanyToolbar />

      <CompanyTable />
    </ModulePage>
  );
}