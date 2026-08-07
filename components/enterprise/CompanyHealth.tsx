"use client";

import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  computeCompanyHealth,
  type CompanyHealthInput,
  type CompanyHealthResult,
  type HealthTone,
} from "@/lib/company-health";

export { computeCompanyHealth };
export type { CompanyHealthInput, CompanyHealthResult };

const toneBar: Record<HealthTone, string> = {
  good: "bg-[color:var(--success)]",
  warn: "bg-[color:var(--warning)]",
  bad: "bg-[color:var(--danger)]",
};

const tonePill: Record<HealthTone, string> = {
  good: "bg-success-soft text-[color:var(--success)] ring-success/25",
  warn: "bg-warning-soft text-[color:var(--warning)] ring-warning/25",
  bad: "bg-danger-soft text-[color:var(--danger)] ring-danger/25",
};

export function CompanyHealth({ metrics }: { metrics: CompanyHealthInput }) {
  const health = computeCompanyHealth(metrics);

  return (
    <section className="rounded-xl border bg-surface-raised p-4">
      <div className="flex items-center gap-2">
        <HeartPulse className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">Company Health</h3>
        <span className={cn("ml-auto inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", tonePill[health.tone])}>
          {health.label}
        </span>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-500", toneBar[health.tone])}
            style={{ width: `${health.score}%` }}
            role="progressbar"
            aria-valuenow={health.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Company health score"
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Score {health.score}/100</span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {health.factors.map((f) => (
          <li key={f.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{f.label}</span>
            <span className="flex items-center gap-1.5 text-foreground/80">
              <span className={cn("h-1.5 w-1.5 rounded-full", toneBar[f.tone])} aria-hidden="true" />
              {f.detail}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
