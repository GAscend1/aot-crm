import { prisma } from "@/lib/prisma";
import { dbStageToUi } from "@/lib/server/opportunity-stages";
import { buildForecastSeries } from "@/lib/analytics";
import { getHealthSnapshot } from "@/lib/server/health-snapshot";
import type { DashboardData } from "@/lib/types/dashboard";

const STAGE_ORDER = ["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
const CLOSED = ["Closed Won", "Closed Lost"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Percentage change between two values; guards against division by zero. */
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export type DashboardPayload = DashboardData;

/**
 * Single source of truth for the dashboard payload. Called server-side by the
 * dashboard page (SSR prefetch → hydration) and by GET /api/dashboard (client
 * refetch on the 30s poll). Keeping one implementation means the prefetched
 * and polled shapes can never drift.
 */
export async function getDashboardData(organizationId: string): Promise<DashboardPayload> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 30 * DAY_MS);
  const prevWindowStart = new Date(now.getTime() - 60 * DAY_MS);

  // NOTE: only the KPIs actually surfaced on the dashboard are aggregated here
  // (Dashboard simplification). Customer/company/ticket/quote/invoice counts
  // live in /api/reports and the module pages, not on the home page.
  const [
    openOpps,
    oppLast30,
    oppPrev30,
    overdueNow,
    overdueLast30,
    overduePrev30,
  ] = await Promise.all([
    prisma.opportunity.findMany({
      where: { archivedAt: null, organizationId },
      include: {
        stage: { select: { name: true } },
        customer: { select: { name: true } },
        owner: { select: { name: true } },
      },
    }),
    prisma.opportunity.findMany({
      where: { createdAt: { gte: windowStart }, organizationId },
      include: { stage: { select: { name: true } } },
    }),
    prisma.opportunity.findMany({
      where: { createdAt: { gte: prevWindowStart, lt: windowStart }, organizationId },
      include: { stage: { select: { name: true } } },
    }),
    // Overdue activities across ALL types (tasks, meetings, calls, follow-ups).
    prisma.activity.count({ where: { status: "Planned", dueDate: { lt: now }, organizationId } }),
    prisma.activity.count({ where: { status: "Planned", dueDate: { gte: windowStart, lt: now }, organizationId } }),
    prisma.activity.count({ where: { status: "Planned", dueDate: { gte: prevWindowStart, lt: windowStart }, organizationId } }),
  ]);

  // ---------- KPI derivation (all from real aggregates) ----------
  const stageName = (o: { stage?: { name: string } | null }) => dbStageToUi(o.stage?.name ?? "");

  const activeOpps = openOpps.filter((o) => !CLOSED.includes(stageName(o)));
  const wonOppsActive = openOpps.filter((o) => stageName(o) === "Closed Won");
  const lostOppsActive = openOpps.filter((o) => stageName(o) === "Closed Lost");
  const wonValue = wonOppsActive.reduce((s, o) => s + o.value, 0);
  const wonLast30 = oppLast30.filter((o) => stageName(o) === "Closed Won").reduce((s, o) => s + o.value, 0);
  const wonPrev30 = oppPrev30.filter((o) => stageName(o) === "Closed Won").reduce((s, o) => s + o.value, 0);
  const pipelineValue = activeOpps.reduce((s, o) => s + o.value, 0);
  const pipelineLast30 = oppLast30.filter((o) => !CLOSED.includes(stageName(o))).reduce((s, o) => s + o.value, 0);
  const pipelinePrev30 = oppPrev30.filter((o) => !CLOSED.includes(stageName(o))).reduce((s, o) => s + o.value, 0);
  const closedTotal = wonOppsActive.length + lostOppsActive.length;
  // Win rate is all-time (won ÷ closed). The trend compares the 30-day close
  // rate against the previous 30-day close rate — same population basis.
  const winRate = closedTotal > 0 ? Math.round((wonOppsActive.length / closedTotal) * 1000) / 10 : 0;
  const closed30 = oppLast30.filter((o) => {
    const s = stageName(o);
    return s === "Closed Won" || s === "Closed Lost";
  });
  const closed30Prev = oppPrev30.filter((o) => {
    const s = stageName(o);
    return s === "Closed Won" || s === "Closed Lost";
  });
  const won30 = closed30.filter((o) => stageName(o) === "Closed Won").length;
  const won30Prev = closed30Prev.filter((o) => stageName(o) === "Closed Won").length;
  const winRate30 = closed30.length > 0 ? Math.round((won30 / closed30.length) * 1000) / 10 : 0;
  const winRate30Prev = closed30Prev.length > 0 ? Math.round((won30Prev / closed30Prev.length) * 1000) / 10 : 0;

  // Revenue forecast (next 3 months from open deals) — needed by the KPI.
  const forecast = buildForecastSeries(
    activeOpps
      .filter((o) => o.expectedCloseDate)
      .map((o) => ({
        value: o.value,
        probability: o.probability,
        expectedCloseDate: o.expectedCloseDate as Date,
      })),
    3,
  );

  const kpis = [
    { title: "Pipeline Value", value: `$${(pipelineValue / 1000).toFixed(1)}k`, change: pctChange(pipelineLast30, pipelinePrev30) },
    { title: "Forecast Revenue", value: `$${(forecast.totals.weighted / 1000).toFixed(1)}k`, change: null },
    { title: "Won Revenue", value: `$${(wonValue / 1000).toFixed(1)}k`, change: pctChange(wonLast30, wonPrev30) },
    { title: "Open Opportunities", value: activeOpps.length, change: pctChange(oppLast30.length, oppPrev30.length) },
    { title: "Win Rate", value: `${winRate}%`, change: Math.round((winRate30 - winRate30Prev) * 10) / 10 },
    { title: "Overdue Activities", value: overdueNow, change: pctChange(overdueLast30, overduePrev30) },
  ];

  // ---------- Pipeline by stage (open opportunities only) ----------
  const byStage: Record<string, { count: number; value: number }> = {};
  for (const o of activeOpps) {
    const s = stageName(o);
    if (!byStage[s]) byStage[s] = { count: 0, value: 0 };
    byStage[s].count += 1;
    byStage[s].value += o.value;
  }
  const pipelineByStage = STAGE_ORDER.filter((s) => byStage[s]).map((s) => ({ stage: s, ...byStage[s] }));

  // ---------- Owner performance (won revenue + active deals) ----------
  const ownerMap: Record<string, { name: string; wonValue: number; wonCount: number; activeDeals: number }> = {};
  for (const o of wonOppsActive) {
    const name = o.owner?.name ?? "Unassigned";
    if (!ownerMap[name]) ownerMap[name] = { name, wonValue: 0, wonCount: 0, activeDeals: 0 };
    ownerMap[name].wonValue += o.value;
    ownerMap[name].wonCount += 1;
  }
  for (const o of activeOpps) {
    const name = o.owner?.name ?? "Unassigned";
    if (!ownerMap[name]) ownerMap[name] = { name, wonValue: 0, wonCount: 0, activeDeals: 0 };
    ownerMap[name].activeDeals += 1;
  }
  const topOwners = Object.values(ownerMap)
    .sort((a, b) => b.wonValue - a.wonValue)
    .slice(0, 6);

  // ---------- Tasks & meetings (real priority + assignee) ----------
  const [recentTaskRows, upcomingMeetings] = await Promise.all([
    prisma.activity.findMany({
      take: 10,
      where: { type: "Task", organizationId },
      orderBy: { dueDate: "asc" },
      include: { assignee: { select: { name: true } } },
    }),
    prisma.activity.findMany({
      take: 6,
      where: { type: "Meeting", status: "Planned", dueDate: { gte: now }, organizationId },
      orderBy: { dueDate: "asc" },
      include: {
        assignee: { select: { name: true } },
        customer: { select: { name: true } },
        opportunity: { select: { title: true } },
      },
    }),
  ]);

  const recentTasks = recentTaskRows.map((a) => ({
    id: a.id,
    subject: a.subject,
    status: a.status,
    dueDate: a.dueDate?.toISOString() ?? a.createdAt.toISOString(),
    priority: a.priority === "Normal" ? "Medium" : a.priority,
    assignee: a.assignee?.name ?? "",
    overdue: a.status !== "Completed" && !!a.dueDate && a.dueDate.getTime() < now.getTime(),
  }));

  const meetings = upcomingMeetings.map((a) => ({
    id: a.id,
    subject: a.subject,
    dueDate: a.dueDate?.toISOString() ?? a.createdAt.toISOString(),
    assignee: a.assignee?.name ?? "",
    related: a.opportunity?.title ?? a.customer?.name ?? "",
  }));

  // ---------- Recent lists ----------
  const [customers, companies, opportunities, tickets] = await Promise.all([
    prisma.customer.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { organizationId },
      include: { company: { select: { companyName: true } } },
    }),
    prisma.company.findMany({ take: 5, orderBy: { createdAt: "desc" }, where: { organizationId } }),
    prisma.opportunity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { organizationId },
      include: { customer: { select: { name: true } }, stage: { select: { name: true } } },
    }),
    prisma.ticket.findMany({ take: 5, orderBy: { createdAt: "desc" }, where: { organizationId } }),
  ]);

  const recentCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company?.companyName ?? "",
    email: c.email,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  const recentCompanies = companies.map((c) => ({
    id: c.id,
    name: c.companyName,
    industry: c.industry,
    city: c.city,
    country: c.country,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  const recentOpportunities = opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    customer: o.customer?.name ?? "",
    value: o.value,
    stage: stageName(o),
    probability: o.probability,
    createdAt: o.createdAt.toISOString(),
  }));

  const recentTickets = tickets.map((t) => ({
    id: t.id,
    subject: t.title,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  // ---------- Customer health snapshot ----------
  const customerHealth = await getHealthSnapshot(organizationId);

  return {
    kpis,
    recentCustomers,
    recentCompanies,
    recentOpportunities,
    recentTickets,
    recentTasks,
    upcomingMeetings: meetings,
    pipelineByStage,
    topOwners,
    forecast,
    customerHealth,
  };
}
