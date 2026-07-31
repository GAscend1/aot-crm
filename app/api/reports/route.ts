import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, forbidden, serverError, logServerError, isReportsManager } from "@/lib/server/api";

export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isReportsManager(user)) return forbidden();
  try {
    const [opportunities, customers, tickets, leads] = await Promise.all([
      prisma.opportunity.findMany({
        include: { stage: { select: { name: true } } },
      }),
      prisma.customer.count(),
      prisma.ticket.count(),
      prisma.lead.findMany({ select: { source: true, status: true } }),
    ]);
    const activeDeals = opportunities.length;
    const pipelineByStage: Record<string, { value: number; count: number }> = {};
    for (const opp of opportunities) {
      const stage = opp.stage?.name ?? "Unknown";
      if (!pipelineByStage[stage]) pipelineByStage[stage] = { value: 0, count: 0 };
      pipelineByStage[stage].value += opp.value;
      pipelineByStage[stage].count += 1;
    }

    const pipelineData = Object.entries(pipelineByStage)
      .map(([stage, data]) => ({ stage, ...data }))
      .sort((a, b) => b.value - a.value);

    const leadSourceCounts: Record<string, number> = {};
    for (const lead of leads) {
      const src = lead.source || "Other";
      leadSourceCounts[src] = (leadSourceCounts[src] || 0) + 1;
    }
    const totalLeads = leads.length;
    const leadSources = Object.entries(leadSourceCounts)
      .map(([name, value]) => ({ name, value: Math.round((value / totalLeads) * 100) }))
      .sort((a, b) => b.value - a.value);

    const revenue = opportunities.reduce((s, o) => s + o.value, 0);

    return NextResponse.json({
      revenue,
      pipelineValue: pipelineData.reduce((s, p) => s + p.value, 0),
      winRate: activeDeals > 0 ? Math.round((opportunities.filter((o) => o.stage?.name === "ClosedWon").length / activeDeals) * 100) : 0,
      activeDeals,
      leadsGenerated: totalLeads,
      conversionRate: totalLeads > 0 ? Math.round((activeDeals / totalLeads) * 100) : 0,
      customersTotal: customers,
      ticketsTotal: tickets,
      pipelineData,
      leadSources,
    });
  } catch (err) {
    logServerError("GET /api/reports", err);
    return serverError("Failed to fetch reports");
  }
}
