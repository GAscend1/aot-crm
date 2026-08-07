import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/server/dashboard-data";
import { getCrmUser, unauthorized } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const data = await getDashboardData(user.organizationId);
  return NextResponse.json(data);
}
