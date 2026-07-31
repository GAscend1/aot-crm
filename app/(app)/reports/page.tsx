import { redirect } from "next/navigation";
import { getCrmUser } from "@/lib/server/api";

import ReportsClientPage from "./ReportsClientPage";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCrmUser();
  if (!user) redirect("/login");
  if (!["SUPER_ADMIN", "ADMIN", "SALES_MANAGER"].includes(user.role)) redirect("/dashboard");

  return <ReportsClientPage />;
}
