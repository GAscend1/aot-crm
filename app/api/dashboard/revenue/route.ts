import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized } from "@/lib/server/api";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  const now = new Date();
  // Rolling 12-month window (Jan 1 of 11 months ago through today)
  const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Won revenue: opportunities in the Closed Won stage
  const won = await prisma.opportunity.findMany({
    where: { archivedAt: null, organizationId: user.organizationId, stage: { name: "ClosedWon" }, createdAt: { gte: from } },
    select: { value: true, createdAt: true },
  });

  // Paid revenue: invoices marked PAID in the window
  const paid = await prisma.invoice.findMany({
    where: { archivedAt: null, organizationId: user.organizationId, status: "PAID", paidAt: { gte: from } },
    select: { total: true, paidAt: true, createdAt: true },
  });

  const wonByMonth: Record<string, number> = {};
  for (const o of won) wonByMonth[monthKey(o.createdAt)] = (wonByMonth[monthKey(o.createdAt)] || 0) + o.value;

  const paidByMonth: Record<string, number> = {};
  for (const i of paid) paidByMonth[monthKey(i.paidAt ?? i.createdAt)] = (paidByMonth[monthKey(i.paidAt ?? i.createdAt)] || 0) + i.total;

  const monthlyRevenue: { month: string; revenue: number; paid: number; target: number }[] = [];
  let totalWon = 0;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const revenue = wonByMonth[key] || 0;
    totalWon += revenue;
    monthlyRevenue.push({ month: MONTHS[d.getMonth()], revenue, paid: paidByMonth[key] || 0, target: 0 });
  }

  // Target = trailing 12-month average won revenue (a real derived benchmark)
  const avgMonthly = Math.round(totalWon / monthlyRevenue.length);
  for (const m of monthlyRevenue) m.target = avgMonthly;

  return NextResponse.json({ monthlyRevenue });
}
