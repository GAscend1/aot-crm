import { redirect } from "next/navigation";
import { getCrmUser } from "@/lib/server/api";

import ReportsClientPage from "./ReportsClientPage";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCrmUser();
  if (!user) redirect("/login");

  return <ReportsClientPage />;
}
