export type DealHealthTone = "good" | "warn" | "bad" | "neutral";

export interface DealHealth {
  /** 0-100 composite score. */
  score: number;
  label: string;
  tone: DealHealthTone;
}

interface DealHealthInput {
  stage?: string;
  status?: string;
  probability?: number;
  expectedCloseDate?: string;
  updatedAt?: string;
}

const toneClasses: Record<DealHealthTone, string> = {
  good: "bg-success-soft text-[color:var(--success)] ring-success/25",
  warn: "bg-warning-soft text-[color:var(--warning)] ring-warning/25",
  bad: "bg-danger-soft text-[color:var(--danger)] ring-danger/25",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export const dealHealthToneClass = (tone: DealHealthTone) => toneClasses[tone];

/**
 * Heuristic deal-health score. Uses only data already on the opportunity
 * record (probability, stage, expected close, recency), so it needs no extra
 * queries. Won/Lost deals short-circuit to their terminal state.
 */
export function computeDealHealth(opp: DealHealthInput): DealHealth {
  const status = (opp.status ?? "Open").toLowerCase();
  if (status === "won") return { score: 100, label: "Won", tone: "good" };
  if (status === "lost") return { score: 0, label: "Lost", tone: "bad" };

  let score = opp.probability ?? 0;
  const flags: string[] = [];

  const expected = opp.expectedCloseDate ? new Date(opp.expectedCloseDate) : null;
  if (expected && !Number.isNaN(expected.getTime())) {
    const daysUntil = Math.ceil((expected.getTime() - Date.now()) / 86_400_000);
    if (daysUntil < 0) {
      score = Math.max(0, score - 25);
      flags.push("Overdue");
    } else if (daysUntil <= 7) {
      score = Math.max(0, score - 10);
      flags.push("Closing soon");
    }
  }

  if (opp.updatedAt) {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(opp.updatedAt).getTime()) / 86_400_000);
    if (daysSinceUpdate > 30) {
      score = Math.max(0, score - 15);
      flags.push("Stale");
    }
  }

  const stage = opp.stage ?? "";
  if (/closed won|closedwon/i.test(stage)) return { score: 100, label: "Won", tone: "good" };
  if (/closed lost|closedlost/i.test(stage)) return { score: 0, label: "Lost", tone: "bad" };

  if (score >= 60) return { score, label: flags[0] ?? "On track", tone: "good" };
  if (score >= 35) return { score, label: flags[0] ?? "At risk", tone: "warn" };
  return { score, label: flags[0] ?? "Stalled", tone: "bad" };
}
