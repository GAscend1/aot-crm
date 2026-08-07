/**
 * Pure company-health scoring. Extracted from the CompanyHealth component so
 * server routes (reports, dashboard) can compute health without importing a
 * "use client" module.
 */

export interface CompanyHealthInput {
  peopleCount: number;
  openOpportunities: number;
  pipelineValue: number;
  wonRevenue: number;
  openTickets: number;
  recentActivityCount: number;
}

export type HealthTone = "good" | "warn" | "bad";

export interface CompanyHealthResult {
  score: number;
  label: string;
  tone: HealthTone;
  factors: { label: string; tone: HealthTone; detail: string }[];
}

/** Heuristic health score for a company, derived from 360 metrics. */
export function computeCompanyHealth(m: CompanyHealthInput): CompanyHealthResult {
  const factors: CompanyHealthResult["factors"] = [];
  let score = 50;

  if (m.wonRevenue > 0) {
    score += 20;
    factors.push({ label: "Revenue history", tone: "good", detail: `${money(m.wonRevenue)} won` });
  } else {
    factors.push({ label: "Revenue history", tone: "warn", detail: "No won revenue yet" });
  }

  if (m.openOpportunities > 0) {
    score += 15;
    factors.push({ label: "Pipeline", tone: "good", detail: `${m.openOpportunities} open · ${money(m.pipelineValue)}` });
  } else {
    factors.push({ label: "Pipeline", tone: "warn", detail: "No open opportunities" });
  }

  if (m.openTickets === 0) {
    score += 10;
    factors.push({ label: "Support", tone: "good", detail: "No open tickets" });
  } else if (m.openTickets <= 3) {
    score += 5;
    factors.push({ label: "Support", tone: "good", detail: `${m.openTickets} open tickets` });
  } else {
    score -= 15;
    factors.push({ label: "Support", tone: "bad", detail: `${m.openTickets} open tickets` });
  }

  if (m.peopleCount >= 2) {
    score += 5;
    factors.push({ label: "Relationship depth", tone: "good", detail: `${m.peopleCount} contacts` });
  } else {
    factors.push({ label: "Relationship depth", tone: "warn", detail: "Few contacts on file" });
  }

  if (m.recentActivityCount > 0) {
    score += 10;
    factors.push({ label: "Engagement", tone: "good", detail: `${m.recentActivityCount} recent interactions` });
  } else {
    factors.push({ label: "Engagement", tone: "warn", detail: "No recent interactions" });
  }

  score = Math.max(5, Math.min(98, score));
  const tone: HealthTone = score >= 75 ? "good" : score >= 45 ? "warn" : "bad";
  const label = score >= 75 ? "Healthy" : score >= 45 ? "At risk" : "Needs attention";

  return { score, label, tone, factors };
}

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
