import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbStageToUi } from "@/lib/server/opportunity-stages";

export const dynamic = "force-dynamic";

const STAGE_ORDER = ["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
const CLOSED = ["Closed Won", "Closed Lost"];
const DAY_MS = 24 * 60 * 60 * 1000;

/** Percentage change between two values; guards against division by zero. */
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function GET() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 30 * DAY_MS);
  const prevWindowStart = new Date(now.getTime() - 60 * DAY_MS);

  const [
    customerTotal,
    customerLast30,
    customerPrev30,
    companyTotal,
    companyLast30,
    companyPrev30,
    openOpps,
    oppLast30,
    oppPrev30,
    ticketOpen,
    ticketLast30,
    ticketPrev30,
    leadTotal,
    leadConverted,
    leadLast30,
    leadPrev30,
    leadConvertedLast30,
    leadConvertedPrev30,
    quoteCount,
    quoteLast30,
    quotePrev30,
    invoiceCount,
    invoiceLast30,
    invoicePrev30,
    paidLast30,
    paidPrev30,
    overdueNow,
    overdueLast30,
    overduePrev30,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: windowStart } } }),
    prisma.customer.count({ where: { createdAt: { gte: prevWindowStart, lt: windowStart } } }),
    prisma.company.count(),
    prisma.company.count({ where: { createdAt: { gte: windowStart } } }),
    prisma.company.count({ where: { createdAt: { gte: prevWindowStart, lt: windowStart } } }),
    prisma.opportunity.findMany({
      where: { archivedAt: null },
      include: {
        stage: { select: { name: true } },
        customer: { select: { name: true } },
        owner: { select: { name: true } },
      },
    }),
    prisma.opportunity.findMany({
      where: { createdAt: { gte: windowStart } },
      include: { stage: { select: { name: true } } },
    }),
    prisma.opportunity.findMany({
      where: { createdAt: { gte: prevWindowStart, lt: windowStart } },
      include: { stage: { select: { name: true } } },
    }),
    prisma.ticket.count({ where: { status: { not: "Closed" } } }),
    prisma.ticket.count({ where: { status: { not: "Closed" }, createdAt: { gte: windowStart } } }),
    prisma.ticket.count({ where: { status: { not: "Closed" }, createdAt: { gte: prevWindowStart, lt: windowStart } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "Converted" } }),
    prisma.lead.count({ where: { createdAt: { gte: windowStart } } }),
    prisma.lead.count({ where: { createdAt: { gte: prevWindowStart, lt: windowStart } } }),
    prisma.lead.count({ where: { status: "Converted", createdAt: { gte: windowStart } } }),
    prisma.lead.count({ where: { status: "Converted", createdAt: { gte: prevWindowStart, lt: windowStart } } }),
    prisma.quote.count({ where: { archivedAt: null } }),
    prisma.quote.count({ where: { archivedAt: null, createdAt: { gte: windowStart } } }),
    prisma.quote.count({ where: { archivedAt: null, createdAt: { gte: prevWindowStart, lt: windowStart } } }),
    prisma.invoice.count({ where: { archivedAt: null } }),
    prisma.invoice.count({ where: { archivedAt: null, createdAt: { gte: windowStart } } }),
    prisma.invoice.count({ where: { archivedAt: null, createdAt: { gte: prevWindowStart, lt: windowStart } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "PAID", paidAt: { gte: windowStart } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: "PAID", paidAt: { gte: prevWindowStart, lt: windowStart } } }),
    prisma.activity.count({ where: { type: "Task", status: "Planned", dueDate: { lt: now } } }),
    prisma.activity.count({ where: { type: "Task", status: "Planned", dueDate: { gte: windowStart, lt: now } } }),
    prisma.activity.count({ where: { type: "Task", status: "Planned", dueDate: { gte: prevWindowStart, lt: windowStart } } }),
  ]);

  // ---------- KPI derivation (all from real aggregates) ----------
  const stageName = (o: { stage?: { name: string } | null }) => dbStageToUi(o.stage?.name ?? "");

  const activeOpps = openOpps.filter((o) => !CLOSED.includes(stageName(o)));
  const wonOppsActive = openOpps.filter((o) => stageName(o) === "Closed Won");
  const wonValue = wonOppsActive.reduce((s, o) => s + o.value, 0);
  const wonLast30 = oppLast30.filter((o) => stageName(o) === "Closed Won").reduce((s, o) => s + o.value, 0);
  const wonPrev30 = oppPrev30.filter((o) => stageName(o) === "Closed Won").reduce((s, o) => s + o.value, 0);
  const pipelineValue = activeOpps.reduce((s, o) => s + o.value, 0);
  const pipelineLast30 = oppLast30.filter((o) => !CLOSED.includes(stageName(o))).reduce((s, o) => s + o.value, 0);
  const pipelinePrev30 = oppPrev30.filter((o) => !CLOSED.includes(stageName(o))).reduce((s, o) => s + o.value, 0);
  const conversionRate = leadTotal > 0 ? Math.round((leadConverted / leadTotal) * 1000) / 10 : 0;
  const convLast30 = leadLast30 > 0 ? Math.round((leadConvertedLast30 / leadLast30) * 1000) / 10 : 0;
  const convPrev30 = leadPrev30 > 0 ? Math.round((leadConvertedPrev30 / leadPrev30) * 1000) / 10 : 0;

  const kpis = [
    { title: "Won Revenue", value: `$${(wonValue / 1000).toFixed(1)}k`, change: pctChange(wonLast30, wonPrev30) },
    { title: "Pipeline Value", value: `$${(pipelineValue / 1000).toFixed(1)}k`, change: pctChange(pipelineLast30, pipelinePrev30) },
    { title: "Open Opportunities", value: activeOpps.length, change: pctChange(oppLast30.length, oppPrev30.length) },
    { title: "New Leads", value: leadLast30, change: pctChange(leadLast30, leadPrev30) },
    { title: "Conversion Rate", value: `${conversionRate}%`, change: Math.round((convLast30 - convPrev30) * 10) / 10 },
    { title: "Customers", value: customerTotal, change: pctChange(customerLast30, customerPrev30) },
    { title: "Companies", value: companyTotal, change: pctChange(companyLast30, companyPrev30) },
    { title: "Open Tickets", value: ticketOpen, change: pctChange(ticketLast30, ticketPrev30) },
    { title: "Overdue Tasks", value: overdueNow, change: pctChange(overdueLast30, overduePrev30) },
    { title: "Quotes", value: quoteCount, change: pctChange(quoteLast30, quotePrev30) },
    { title: "Invoices", value: invoiceCount, change: pctChange(invoiceLast30, invoicePrev30) },
    { title: "Paid Revenue", value: `$${((paidLast30._sum.total || 0) / 1000).toFixed(1)}k`, change: pctChange(paidLast30._sum.total || 0, paidPrev30._sum.total || 0) },
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
      where: { type: "Task" },
      orderBy: { dueDate: "asc" },
      include: { assignee: { select: { name: true } } },
    }),
    prisma.activity.findMany({
      take: 6,
      where: { type: "Meeting", status: "Planned", dueDate: { gte: now } },
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
      include: { company: { select: { companyName: true } } },
    }),
    prisma.company.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    prisma.opportunity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, stage: { select: { name: true } } },
    }),
    prisma.ticket.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
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

  return NextResponse.json({
    kpis,
    recentCustomers,
    recentCompanies,
    recentOpportunities,
    recentTickets,
    recentTasks,
    upcomingMeetings: meetings,
    pipelineByStage,
    topOwners,
  });
}
