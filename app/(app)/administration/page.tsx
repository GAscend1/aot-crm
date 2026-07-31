import { redirect } from "next/navigation";

import { PageLayout } from "@/components/common/PageLayout";
import { getCrmUser } from "@/lib/server/api";

import { AdminStats } from "./components/AdminStats";
import { AdminTable } from "./components/AdminTable";

export default async function AdministrationPage() {
  const user = await getCrmUser();
  if (!user) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) redirect("/dashboard");

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
