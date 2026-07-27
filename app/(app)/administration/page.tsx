import { PageLayout } from "@/components/common/PageLayout";

import { AdminStats } from "./components/AdminStats";
import { AdminTable } from "./components/AdminTable";

export default function AdministrationPage() {
  return (
    <PageLayout
      title="Administration"
      description="Manage users, roles, and system-wide settings."
    >
      <AdminStats />

      <AdminTable />
    </PageLayout>
  );
}
