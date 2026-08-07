import { prisma } from "@/lib/prisma";
import { computeCompanyHealth, type HealthTone } from "@/lib/company-health";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CompanyHealthRow {
  id: string;
  name: string;
  industry: string | null;
  score: number;
  label: string;
  tone: HealthTone;
  pipelineValue: number;
  wonRevenue: number;
  openTickets: number;
  peopleCount: number;
}

export interface HealthSnapshot {
  distribution: { name: string; value: number }[];
  healthy: number;
  atRisk: number;
  needsAttention: number;
  /** Top companies by health score (ascending = worst first), for at-risk lists. */
  atRiskCompanies: CompanyHealthRow[];
  topCompanies: CompanyHealthRow[];
}

/**
 * Compute a customer-health snapshot across all non-archived companies.
 * Aggregates are derived with groupBy queries (no per-company round trips).
 */
export async function getHealthSnapshot(organizationId: string): Promise<HealthSnapshot> {
  const since = new Date(Date.now() - 90 * DAY_MS);

  const [companies, contactsByCompany, openOpps, wonOpps, openTickets, recentActivities] = await Promise.all([
    prisma.company.findMany({
      where: { archivedAt: null, organizationId },
      select: { id: true, companyName: true, industry: true },
    }),
    prisma.contact.groupBy({
      by: ["companyId"],
      where: { archivedAt: null, organizationId },
      _count: { _all: true },
    }),
    prisma.opportunity.findMany({
      where: { archivedAt: null, organizationId, stage: { name: { notIn: ["ClosedWon", "ClosedLost"] } } },
      select: {
        value: true,
        customer: { select: { companyId: true } },
      },
    }),
    prisma.opportunity.findMany({
      where: { archivedAt: null, organizationId, stage: { name: "ClosedWon" } },
      select: {
        value: true,
        customer: { select: { companyId: true } },
      },
    }),
    prisma.ticket.findMany({
      where: { status: { not: "Closed" }, organizationId },
      select: { customer: { select: { companyId: true } } },
    }),
    prisma.activity.groupBy({
      by: ["companyId"],
      where: { createdAt: { gte: since }, organizationId },
      _count: { _all: true },
    }),
  ]);

  const people = new Map<string, number>();
  for (const g of contactsByCompany) {
    if (g.companyId) people.set(g.companyId, g._count._all);
  }

  // Real open-opportunity counts + pipeline value per company (a $0 deal still
  // counts toward the pipeline factor — no boolean proxy).
  const openCountByCompany = new Map<string, number>();
  const pipelineByCompany = new Map<string, number>();
  for (const o of openOpps) {
    const cid = o.customer?.companyId;
    if (!cid) continue;
    openCountByCompany.set(cid, (openCountByCompany.get(cid) || 0) + 1);
    pipelineByCompany.set(cid, (pipelineByCompany.get(cid) || 0) + o.value);
  }

  const wonByCompany = new Map<string, number>();
  for (const o of wonOpps) {
    const cid = o.customer?.companyId;
    if (!cid) continue;
    wonByCompany.set(cid, (wonByCompany.get(cid) || 0) + o.value);
  }

  const ticketsByCompany = new Map<string, number>();
  for (const t of openTickets) {
    const cid = t.customer?.companyId;
    if (!cid) continue;
    ticketsByCompany.set(cid, (ticketsByCompany.get(cid) || 0) + 1);
  }

  const activityByCompany = new Map<string, number>();
  for (const g of recentActivities) {
    if (g.companyId) activityByCompany.set(g.companyId, g._count._all);
  }

  const rows: CompanyHealthRow[] = companies.map((c) => {
    const pipelineValue = pipelineByCompany.get(c.id) || 0;
    const wonRevenue = wonByCompany.get(c.id) || 0;
    const openTickets = ticketsByCompany.get(c.id) || 0;
    const peopleCount = people.get(c.id) || 0;
    const openOpportunities = openCountByCompany.get(c.id) || 0;
    const health = computeCompanyHealth({
      peopleCount,
      openOpportunities,
      pipelineValue,
      wonRevenue,
      openTickets,
      recentActivityCount: activityByCompany.get(c.id) || 0,
    });
    return {
      id: c.id,
      name: c.companyName,
      industry: c.industry,
      score: health.score,
      label: health.label,
      tone: health.tone,
      pipelineValue,
      wonRevenue,
      openTickets,
      peopleCount,
    };
  });

  const sorted = rows.sort((a, b) => b.score - a.score);
  const healthy = sorted.filter((r) => r.tone === "good").length;
  const atRisk = sorted.filter((r) => r.tone === "warn").length;
  const needsAttention = sorted.filter((r) => r.tone === "bad").length;

  return {
    distribution: [
      { name: "Healthy", value: healthy },
      { name: "At risk", value: atRisk },
      { name: "Needs attention", value: needsAttention },
    ],
    healthy,
    atRisk,
    needsAttention,
    atRiskCompanies: [...sorted].sort((a, b) => a.score - b.score).slice(0, 8),
    topCompanies: sorted.slice(0, 8),
  };
}
