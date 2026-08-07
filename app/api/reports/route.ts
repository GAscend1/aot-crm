import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, featureGate } from "@/lib/server/api";
import { getSubscription } from "@/lib/server/tenant";
import { canUseFeature } from "@/lib/entitlements";
import { dbStageToUi, uiStageToDb } from "@/lib/server/opportunity-stages";
import {
  averageCycleDays,
  breakdownByReason,
  buildForecastSeries,
  buildTeamProductivity,
  buildWinRateTrend,
  computeVelocity,
  type OwnerMetric,
} from "@/lib/analytics";
import { getHealthSnapshot } from "@/lib/server/health-snapshot";
import type { InvoiceStatus, QuoteStatus } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

const STAGE_ORDER = ["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

function parseRange(searchParams: URLSearchParams): { from: Date; to: Date; fromStr: string; toStr: string } {
  const range = searchParams.get("range") ?? "year";
  const now = new Date();
  let from = new Date(now.getFullYear(), 0, 1);
  let to = now;
  if (searchParams.get("from") && searchParams.get("to")) {
    from = new Date(`${searchParams.get("from")}T00:00:00`);
    to = new Date(`${searchParams.get("to")}T23:59:59`);
  } else if (range === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "7d") {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === "30d") {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    from = new Date(now.getFullYear(), q * 3, 1);
  }
  return { from, to, fromStr: from.toISOString().split("T")[0], toStr: to.toISOString().split("T")[0] };
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initMonthSeries(from: Date, to: Date): { label: string; key: string }[] {
  const series: { label: string; key: string }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cursor <= end) {
    series.push({ label: MONTH_LABELS[cursor.getMonth()], key: monthKey(cursor) });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return series.length ? series : [{ label: MONTH_LABELS[from.getMonth()], key: monthKey(from) }];
}

export async function GET(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await featureGate(user, "reports");
  if (gate) return gate;
  const subscription = await getSubscription(user.organizationId);
  const advancedAnalytics = canUseFeature(subscription?.planCode ?? "", "advanced_analytics");
  const { searchParams } = new URL(request.url);
  const { from, to, fromStr, toStr } = parseRange(searchParams);
  const ownerId = searchParams.get("ownerId");
  const customerId = searchParams.get("customerId");
  const companyId = searchParams.get("companyId");
  const source = searchParams.get("source");
  const stage = searchParams.get("stage");
  const status = searchParams.get("status");

  try {
    const [
      opportunities,
      leads,
      customers,
      companies,
      tickets,
      activities,
      quotes,
      invoices,
      users,
    ] = await Promise.all([
      prisma.opportunity.findMany({
        where: {
          organizationId: user.organizationId,
          createdAt: { gte: from, lte: to },
          ...(ownerId ? { ownerId } : {}),
          ...(customerId ? { customerId } : {}),
          ...(companyId ? { customer: { companyId } } : {}),
          ...(stage ? { stage: { name: uiStageToDb(stage) } } : {}),
          ...(status ? { status } : {}),
        },
        include: {
          stage: true,
          owner: { select: { name: true } },
          customer: { include: { company: true } },
        },
      }),
      prisma.lead.findMany({
        where: {
          organizationId: user.organizationId,
          createdAt: { gte: from, lte: to },
          ...(ownerId ? { assignedToId: ownerId } : {}),
          ...(source ? { source } : {}),
        },
        select: { source: true, status: true, createdAt: true },
      }),
      prisma.customer.findMany({
        where: { organizationId: user.organizationId, createdAt: { gte: from, lte: to } },
        include: { company: true },
      }),
      prisma.company.findMany({ where: { organizationId: user.organizationId, createdAt: { gte: from, lte: to } } }),
      prisma.ticket.findMany({
        where: { organizationId: user.organizationId, createdAt: { gte: from, lte: to } },
        select: { status: true, createdAt: true },
      }),
      prisma.activity.findMany({
        where: { organizationId: user.organizationId, createdAt: { gte: from, lte: to } },
        select: {
          type: true,
          status: true,
          completedAt: true,
          createdAt: true,
          assignee: { select: { name: true } },
        },
      }),
      prisma.quote.findMany({
        where: {
          organizationId: user.organizationId,
          createdAt: { gte: from, lte: to },
          archivedAt: null,
          ...(customerId ? { customerId } : {}),
          ...(companyId ? { companyId } : {}),
        },
        select: { status: true, total: true, createdAt: true },
      }),
      prisma.invoice.findMany({
        where: {
          organizationId: user.organizationId,
          createdAt: { gte: from, lte: to },
          archivedAt: null,
          ...(customerId ? { customerId } : {}),
          ...(companyId ? { companyId } : {}),
        },
        select: { status: true, total: true, dueDate: true, paidAt: true, issueDate: true, createdAt: true },
      }),
      prisma.user.findMany({ where: { organizationId: user.organizationId }, select: { id: true, name: true } }),
    ]);

    // ---------- Pipeline analytics ----------
    const pipelineByStage: Record<string, { count: number; value: number }> = {};
    const stageToId: Record<string, string> = {};
    for (const opp of opportunities) {
      const stageName = dbStageToUi(opp.stage?.name ?? "");
      if (!pipelineByStage[stageName]) pipelineByStage[stageName] = { count: 0, value: 0 };
      pipelineByStage[stageName].count += 1;
      pipelineByStage[stageName].value += opp.value;
      if (opp.stageId && !stageToId[stageName]) stageToId[stageName] = opp.stageId;
    }
    const pipelineData = STAGE_ORDER.filter((s) => pipelineByStage[s]).map((s) => ({
      stage: s,
      count: pipelineByStage[s].count,
      value: pipelineByStage[s].value,
    }));
    const pipelineValue = opportunities.reduce((sum, o) => sum + o.value, 0);
    const weightedRevenue = opportunities.reduce((sum, o) => sum + o.value * (o.probability / 100), 0);
    const expectedRevenue = opportunities.filter((o) => dbStageToUi(o.stage?.name ?? "") !== "Closed Lost").reduce((sum, o) => sum + o.value, 0);
    const won = opportunities.filter((o) => dbStageToUi(o.stage?.name ?? "") === "Closed Won");
    const lost = opportunities.filter((o) => dbStageToUi(o.stage?.name ?? "") === "Closed Lost");
    const active = opportunities.filter((o) => !["Closed Won", "Closed Lost"].includes(dbStageToUi(o.stage?.name ?? "")));
    const wonValue = won.reduce((s, o) => s + o.value, 0);
    const totalClosed = won.length + lost.length;
    const winRate = totalClosed > 0 ? Math.round((won.length / totalClosed) * 100) : 0;
    const activeDeals = active.length;

    // Funnel (top-down: Discovery → ... → Closed Won)
    let funnelSum = 0;
    const funnelData = STAGE_ORDER.map((s) => {
      const c = pipelineByStage[s]?.count ?? 0;
      funnelSum = s === "Discovery" ? c : Math.min(funnelSum, c);
      return { stage: s, count: funnelSum };
    }).filter((f) => f.count > 0);

    // Stage conversion rate (to next stage)
    const stageConversionRate = STAGE_ORDER.slice(0, -1).map((s, i) => {
      const current = pipelineByStage[s]?.count ?? 0;
      const next = pipelineByStage[STAGE_ORDER[i + 1]]?.count ?? 0;
      return {
        stage: s,
        conversionRate: current > 0 ? Math.round((next / current) * 100) : 0,
      };
    });

    // Average days in stage (from stage history)
    const stageHistory = await prisma.opportunityStageHistory.findMany({
      where: { opportunityId: { in: opportunities.map((o) => o.id) } },
      include: { toStage: true },
    });
    const daysInStage: Record<string, number[]> = {};
    for (const h of stageHistory) {
      const name = dbStageToUi(h.toStage?.name ?? "");
      if (!daysInStage[name]) daysInStage[name] = [];
      const created = opportunities.find((o) => o.id === h.opportunityId)?.createdAt;
      if (created) daysInStage[name].push(Math.max(0, (h.createdAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
    }
    const avgDaysInStage = STAGE_ORDER.filter((s) => daysInStage[s]?.length).map((s) => ({
      stage: s,
      days: Math.round((daysInStage[s].reduce((a, b) => a + b, 0) / daysInStage[s].length) * 10) / 10,
    }));

    // ---------- Pipeline velocity ----------
    // Average sales cycle (days) from won deals that carry a closedAt.
    const avgCycleDays = advancedAnalytics ? averageCycleDays(
      won.map((o) => ({ createdAt: o.createdAt, closedAt: o.closedAt })),
    ) : 0;
    const velocityPerDay = advancedAnalytics ? computeVelocity(weightedRevenue, avgCycleDays) : 0;
    // Deals advanced into each stage during the window (stage history entries).
    // Gated with the rest of the velocity block — non-entitled plans get no
    // per-stage movement data (server-side enforcement, not just UI hiding).
    const dealsMovedByStage = advancedAnalytics
      ? (() => {
          const movedByStage: Record<string, number> = {};
          for (const h of stageHistory) {
            const name = dbStageToUi(h.toStage?.name ?? "");
            if (h.createdAt >= from && h.createdAt <= to) movedByStage[name] = (movedByStage[name] || 0) + 1;
          }
          return STAGE_ORDER.filter((s) => movedByStage[s]).map((s) => ({
            stage: s,
            count: movedByStage[s],
          }));
        })()
      : [];

    // ---------- Revenue forecast (next 6 months from open deals) ----------
    const forecast = advancedAnalytics
      ? buildForecastSeries(
          opportunities
            .filter((o) => !["Closed Won", "Closed Lost"].includes(dbStageToUi(o.stage?.name ?? "")))
            .filter((o) => o.expectedCloseDate)
            .map((o) => ({
              value: o.value,
              probability: o.probability,
              expectedCloseDate: o.expectedCloseDate as Date,
            })),
          6,
          to,
        )
      : { months: [], totals: { committed: 0, weighted: 0, best: 0 } };

    // ---------- Win/loss analytics ----------
    const wonByReason = advancedAnalytics
      ? breakdownByReason(
          won.map((o) => ({ value: o.value, reason: o.wonReason })),
          "No reason recorded",
        )
      : [];
    const lostByReason = advancedAnalytics
      ? breakdownByReason(
          lost.map((o) => ({ value: o.value, reason: o.lostReason })),
          "No reason recorded",
        )
      : [];
    const winRateTrend = advancedAnalytics
      ? buildWinRateTrend(
          [...won, ...lost].map((o) => ({
            isWon: dbStageToUi(o.stage?.name ?? "") === "Closed Won",
            closedAt: o.closedAt,
            createdAt: o.createdAt,
          })),
          from,
          to,
        )
      : [];
    const wonValueByReason = wonByReason.reduce((s, r) => s + r.value, 0);
    const lostValueByReason = lostByReason.reduce((s, r) => s + r.value, 0);

    // ---------- Team productivity ----------
    const teamProductivity: OwnerMetric[] = advancedAnalytics
      ? buildTeamProductivity(
          opportunities.map((o) => {
            const stageUi = dbStageToUi(o.stage?.name ?? "");
            return {
              owner: o.owner,
              value: o.value,
              isWon: stageUi === "Closed Won",
              isClosed: stageUi === "Closed Won" || stageUi === "Closed Lost",
            };
          }),
          activities,
        )
      : [];

    // ---------- Customer health ----------
    const customerHealth = advancedAnalytics
      ? await getHealthSnapshot(user.organizationId)
      : {
          distribution: [],
          healthy: 0,
          atRisk: 0,
          needsAttention: 0,
          atRiskCompanies: [],
          topCompanies: [],
        };

    // ---------- Lead analytics ----------
    const leadSourceCounts: Record<string, number> = {};
    for (const l of leads) leadSourceCounts[l.source || "Other"] = (leadSourceCounts[l.source || "Other"] || 0) + 1;
    const leadSources = Object.entries(leadSourceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const leadStatusCounts: Record<string, number> = {};
    for (const l of leads) {
      const st = l.status === "ClosedWon" ? "Closed Won" : l.status === "ClosedLost" ? "Closed Lost" : l.status;
      leadStatusCounts[st] = (leadStatusCounts[st] || 0) + 1;
    }
    const leadByStatus = Object.entries(leadStatusCounts).map(([name, value]) => ({ name, value }));

    const leadFunnelStages = ["New", "Contacted", "Qualified", "Converted"];
    let leadFunnelSum = 0;
    const leadFunnel = leadFunnelStages.map((s) => {
      const c = leadStatusCounts[s] || 0;
      leadFunnelSum = s === "New" ? c : Math.min(leadFunnelSum, c);
      return { stage: s, count: leadFunnelSum };
    }).filter((f) => f.count > 0);

    const leadsGenerated = leads.length;
    const convertedLeads = leads.filter((l) => l.status === "Converted").length;
    const conversionRate = leadsGenerated > 0 ? Math.round((convertedLeads / leadsGenerated) * 100) : 0;

    // ---------- Revenue analytics ----------
    const revenueSeries = initMonthSeries(from, to);
    const revenueByMonth: Record<string, number> = {};
    const paidByMonth: Record<string, number> = {};
    for (const o of won) revenueByMonth[monthKey(o.createdAt)] = (revenueByMonth[monthKey(o.createdAt)] || 0) + o.value;
    for (const i of invoices.filter((i) => i.status === "PAID")) paidByMonth[monthKey(i.paidAt ?? i.issueDate)] = (paidByMonth[monthKey(i.paidAt ?? i.issueDate)] || 0) + i.total;
    const revenueTrend = revenueSeries.map((m) => ({ month: m.label, revenue: revenueByMonth[m.key] || 0 }));
    const paymentTrend = revenueSeries.map((m) => ({ month: m.label, revenue: paidByMonth[m.key] || 0 }));

    const revenueByCustomer: Record<string, number> = {};
    for (const o of won) revenueByCustomer[o.customer?.name || "Unknown"] = (revenueByCustomer[o.customer?.name || "Unknown"] || 0) + o.value;
    const revenueByCustomerData = Object.entries(revenueByCustomer)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const revenueByOwner: Record<string, number> = {};
    for (const o of won) revenueByOwner[o.owner?.name || "Unassigned"] = (revenueByOwner[o.owner?.name || "Unassigned"] || 0) + o.value;
    const revenueByOwnerData = Object.entries(revenueByOwner)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const revenueByCompany: Record<string, number> = {};
    for (const o of won) revenueByCompany[o.customer?.company?.companyName || "Unknown"] = (revenueByCompany[o.customer?.company?.companyName || "Unknown"] || 0) + o.value;
    const revenueByCompanyData = Object.entries(revenueByCompany)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // ---------- Quote analytics ----------
    const quoteStatusCounts: Record<string, number> = {};
    for (const q of quotes) quoteStatusCounts[q.status] = (quoteStatusCounts[q.status] || 0) + 1;
    const quotesByStatus = Object.entries(quoteStatusCounts).map(([name, value]) => ({ name, value }));
    const acceptedQuotes = quotes.filter((q) => q.status === "ACCEPTED").length;
    const quoteAcceptanceRate = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;
    const avgQuoteValue = quotes.length ? Math.round(quotes.reduce((s, q) => s + q.total, 0) / quotes.length) : 0;
    const quoteTotalValue = quotes.reduce((s, q) => s + q.total, 0);
    const quoteByMonth: Record<string, number> = {};
    for (const q of quotes) quoteByMonth[monthKey(q.createdAt)] = (quoteByMonth[monthKey(q.createdAt)] || 0) + q.total;
    const quoteTrend = revenueSeries.map((m) => ({ month: m.label, value: quoteByMonth[m.key] || 0 }));

    // ---------- Invoice analytics ----------
    const invoiceStatusCounts: Record<string, number> = {};
    for (const i of invoices) invoiceStatusCounts[i.status] = (invoiceStatusCounts[i.status] || 0) + 1;
    const invoicesByStatus = Object.entries(invoiceStatusCounts).map(([name, value]) => ({ name, value }));
    const paidRevenue = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
    const outstandingRevenue = invoices.filter((i) => ["ISSUED", "PARTIALLY_PAID"].includes(i.status)).reduce((s, i) => s + i.total, 0);
    const overdueRevenue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
    const invoiceCount = invoices.length;

    // ---------- Customer analytics ----------
    const customerByMonth: Record<string, number> = {};
    for (const c of customers) customerByMonth[monthKey(c.createdAt)] = (customerByMonth[monthKey(c.createdAt)] || 0) + 1;
    const customersByMonth = revenueSeries.map((m) => ({ month: m.label, count: customerByMonth[m.key] || 0 }));

    // ---------- Ticket analytics ----------
    const ticketStatusCounts: Record<string, number> = {};
    for (const t of tickets) ticketStatusCounts[t.status] = (ticketStatusCounts[t.status] || 0) + 1;
    const ticketsByStatus = Object.entries(ticketStatusCounts).map(([name, value]) => ({ name, value }));

    // ---------- Activities over time ----------
    const activityByMonth: Record<string, Record<string, number>> = {};
    for (const a of activities) {
      const key = monthKey(a.createdAt);
      if (!activityByMonth[key]) activityByMonth[key] = { calls: 0, emails: 0, meetings: 0, tasks: 0 };
      if (a.type === "Call") activityByMonth[key].calls += 1;
      else if (a.type === "Email") activityByMonth[key].emails += 1;
      else if (a.type === "Meeting") activityByMonth[key].meetings += 1;
      else if (a.type === "Task") activityByMonth[key].tasks += 1;
    }
    const activitiesOverTime = revenueSeries.map((m) => ({
      month: m.label,
      calls: activityByMonth[m.key]?.calls ?? 0,
      emails: activityByMonth[m.key]?.emails ?? 0,
      meetings: activityByMonth[m.key]?.meetings ?? 0,
      tasks: activityByMonth[m.key]?.tasks ?? 0,
    }));

    // ---------- KPIs ----------
    const kpis = {
      revenue: wonValue,
      pipelineValue,
      winRate,
      activeDeals,
      leadsGenerated,
      conversionRate,
      customersTotal: customers.length,
      companiesTotal: companies.length,
      ticketsTotal: tickets.length,
      quotesTotal: quotes.length,
      quoteAcceptanceRate,
      avgQuoteValue,
      quoteTotalValue,
      invoicesTotal: invoiceCount,
      paidRevenue,
      outstandingRevenue,
      overdueRevenue,
    };

    return NextResponse.json({
      range: { from: fromStr, to: toStr },
      kpis,
      pipelineData,
      funnelData,
      stageConversionRate,
      avgDaysInStage,
      wonVsLost: [
        { name: "Won", value: won.length },
        { name: "Lost", value: lost.length },
      ],
      expectedRevenue,
      weightedRevenue,
      leadSources,
      leadByStatus,
      leadFunnel,
      revenueTrend,
      paymentTrend,
      revenueByCustomer: revenueByCustomerData,
      revenueByOwner: revenueByOwnerData,
      revenueByCompany: revenueByCompanyData,
      quotesByStatus,
      quoteTrend,
      invoicesByStatus,
      customersByMonth,
      ticketsByStatus,
      activitiesOverTime,
      users: users.map((u) => ({ id: u.id, name: u.name ?? "" })),
      // Phase 6 analytics blocks (gated: require the advanced_analytics entitlement)
      advancedAnalytics,
      velocity: { avgCycleDays, velocityPerDay, dealsMovedByStage },
      forecast,
      winLoss: { wonByReason, lostByReason, winRateTrend, wonValue: wonValueByReason, lostValue: lostValueByReason },
      teamProductivity,
      customerHealth,
    });
  } catch (err) {
    logServerError("GET /api/reports", err);
    return serverError("Failed to fetch reports");
  }
}

export type { InvoiceStatus, QuoteStatus };
