/**
 * Pure analytics helpers for the analytics-first dashboard (Phase 6).
 * Kept dependency-free and unit-testable (no prisma / no "use client").
 */

export interface ForecastDeal {
  value: number;
  probability: number;
  expectedCloseDate: Date | string;
}

export interface ForecastMonth {
  month: string;
  committed: number;
  weighted: number;
  best: number;
}

export interface ForecastSeries {
  months: ForecastMonth[];
  totals: { committed: number; weighted: number; best: number };
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "Committed" = full value of deals at ≥80% probability (per common sales methodology). */
export const COMMITTED_PROBABILITY = 80;

/**
 * Build a monthly revenue forecast from open deals with an expected close date.
 * - committed: full value where probability ≥ COMMITTED_PROBABILITY
 * - weighted:  value × probability (probability-weighted pipeline)
 * - best:      full value of every deal that closes in the month
 */
export function buildForecastSeries(deals: ForecastDeal[], months = 6, from = new Date()): ForecastSeries {
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const buckets: ForecastMonth[] = [];
  const bucketMap = new Map<string, number>();

  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = monthKey(d);
    bucketMap.set(key, buckets.length);
    buckets.push({ month: MONTH_LABELS[d.getMonth()], committed: 0, weighted: 0, best: 0 });
  }

  for (const deal of deals) {
    const close = deal.expectedCloseDate instanceof Date ? deal.expectedCloseDate : new Date(deal.expectedCloseDate);
    if (Number.isNaN(close.getTime())) continue;
    const idx = bucketMap.get(monthKey(close));
    if (idx === undefined) continue;

    const value = deal.value || 0;
    const prob = Math.min(100, Math.max(0, deal.probability || 0));
    const bucket = buckets[idx];
    bucket.weighted += value * (prob / 100);
    bucket.best += value;
    if (prob >= COMMITTED_PROBABILITY) bucket.committed += value;
  }

  const totals = buckets.reduce(
    (acc, b) => ({
      committed: acc.committed + b.committed,
      weighted: acc.weighted + b.weighted,
      best: acc.best + b.best,
    }),
    { committed: 0, weighted: 0, best: 0 },
  );

  return { months: buckets, totals };
}

export interface CycleDeal {
  createdAt: Date | string;
  closedAt?: Date | string | null;
}

/** Average sales cycle length (days) for closed deals that have a closedAt. */
export function averageCycleDays(deals: CycleDeal[]): number {
  const cycles: number[] = [];
  for (const deal of deals) {
    if (!deal.closedAt) continue;
    const created = deal.createdAt instanceof Date ? deal.createdAt : new Date(deal.createdAt);
    const closed = deal.closedAt instanceof Date ? deal.closedAt : new Date(deal.closedAt);
    if (Number.isNaN(created.getTime()) || Number.isNaN(closed.getTime())) continue;
    const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (days >= 0) cycles.push(days);
  }
  if (cycles.length === 0) return 0;
  return Math.round((cycles.reduce((a, b) => a + b, 0) / cycles.length) * 10) / 10;
}

/** Pipeline velocity — weighted pipeline value flowing through the sales cycle per day. */
export function computeVelocity(weightedPipelineValue: number, avgCycleDays: number): number {
  if (avgCycleDays <= 0) return 0;
  return Math.round((weightedPipelineValue / avgCycleDays) * 100) / 100;
}

export interface ClosedDeal {
  isWon: boolean;
  closedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface WinRateMonth {
  month: string;
  won: number;
  lost: number;
  winRate: number;
}

/** Monthly win-rate trend over the given date window. */
export function buildWinRateTrend(deals: ClosedDeal[], from: Date, to: Date): WinRateMonth[] {
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  const months: WinRateMonth[] = [];
  const map = new Map<string, number>();

  const cursor = new Date(start);
  while (cursor <= end) {
    const key = monthKey(cursor);
    map.set(key, months.length);
    months.push({ month: MONTH_LABELS[cursor.getMonth()], won: 0, lost: 0, winRate: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const deal of deals) {
    const closed = deal.closedAt instanceof Date ? deal.closedAt : deal.closedAt ? new Date(deal.closedAt) : null;
    const date = closed && !Number.isNaN(closed.getTime()) ? closed : new Date(deal.createdAt);
    const idx = map.get(monthKey(date));
    if (idx === undefined) continue;
    if (deal.isWon) months[idx].won += 1;
    else months[idx].lost += 1;
  }

  for (const m of months) {
    const total = m.won + m.lost;
    m.winRate = total > 0 ? Math.round((m.won / total) * 100) : 0;
  }
  return months;
}

export interface ReasonBreakdown {
  name: string;
  value: number;
  count: number;
}

/** Group deals by a reason field (wonReason/lostReason), bucket missing reasons. */
export function breakdownByReason(
  deals: { value: number; reason?: string | null }[],
  fallbackLabel: string,
): ReasonBreakdown[] {
  const map = new Map<string, ReasonBreakdown>();
  for (const deal of deals) {
    const name = deal.reason?.trim() || fallbackLabel;
    const entry = map.get(name) ?? { name, value: 0, count: 0 };
    entry.value += deal.value || 0;
    entry.count += 1;
    map.set(name, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

export interface OwnerMetric {
  name: string;
  wonValue: number;
  wonCount: number;
  activeDeals: number;
  winRate: number;
  tasksCompleted: number;
  meetingsHeld: number;
  callsMade: number;
  emailsSent: number;
}

export interface OwnerActivityRow {
  assignee?: { name: string | null } | null;
  type: string;
  status: string;
  completedAt?: Date | string | null;
}

/** Per-owner productivity rollup from won/active deals + activity rows. */
export function buildTeamProductivity(
  deals: {
    owner?: { name: string | null } | null;
    value: number;
    isWon: boolean;
    isClosed: boolean;
  }[],
  activities: OwnerActivityRow[],
): OwnerMetric[] {
  const owners = new Map<string, OwnerMetric>();
  const ensure = (name: string): OwnerMetric => {
    let entry = owners.get(name);
    if (!entry) {
      entry = {
        name,
        wonValue: 0,
        wonCount: 0,
        activeDeals: 0,
        winRate: 0,
        tasksCompleted: 0,
        meetingsHeld: 0,
        callsMade: 0,
        emailsSent: 0,
      };
      owners.set(name, entry);
    }
    return entry;
  };

  let wonTotal = 0;
  let closedTotal = 0;
  const ownerWinCounts = new Map<string, number>();
  const ownerClosedCounts = new Map<string, number>();

  for (const deal of deals) {
    const name = deal.owner?.name?.trim() || "Unassigned";
    const entry = ensure(name);
    if (deal.isClosed) {
      closedTotal += 1;
      ownerClosedCounts.set(name, (ownerClosedCounts.get(name) || 0) + 1);
    }
    if (deal.isWon) {
      wonTotal += 1;
      ownerWinCounts.set(name, (ownerWinCounts.get(name) || 0) + 1);
      entry.wonValue += deal.value || 0;
      entry.wonCount += 1;
    } else if (!deal.isClosed) {
      entry.activeDeals += 1;
    }
  }

  for (const activity of activities) {
    const name = activity.assignee?.name?.trim() || "Unassigned";
    const entry = ensure(name);
    if (activity.type === "Task" && activity.status === "Completed") entry.tasksCompleted += 1;
    else if (activity.type === "Meeting") entry.meetingsHeld += 1;
    else if (activity.type === "Call") entry.callsMade += 1;
    else if (activity.type === "Email") entry.emailsSent += 1;
  }

  const overallWinRate = closedTotal > 0 ? Math.round((wonTotal / closedTotal) * 100) : 0;
  for (const [name, entry] of owners) {
    const closed = ownerClosedCounts.get(name) || 0;
    const won = ownerWinCounts.get(name) || 0;
    entry.winRate = closed > 0 ? Math.round((won / closed) * 100) : overallWinRate;
  }

  return Array.from(owners.values()).sort((a, b) => b.wonValue - a.wonValue);
}
