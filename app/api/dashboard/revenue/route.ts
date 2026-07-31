import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    select: { value: true, createdAt: true },
  });

  const monthlyRevenue = MONTHS.map((month, i) => {
    const monthNum = i + 1;
    const revenue = opportunities
      .filter((o) => new Date(o.createdAt).getMonth() + 1 === monthNum)
      .reduce((sum, o) => sum + o.value, 0);
    return {
      month,
      revenue,
      target: Math.round(revenue * 1.15),
    };
  });

  return NextResponse.json({ monthlyRevenue });
}
