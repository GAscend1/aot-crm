"use client";

import Link from "next/link";
import { HeartPulse } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const toneDot: Record<string, string> = {
  good: "bg-[color:var(--success)]",
  warn: "bg-[color:var(--warning)]",
  bad: "bg-[color:var(--danger)]",
};

export function CustomerHealthSnapshot() {
  const { customerHealth } = useDashboardData();

  if (customerHealth.topCompanies.length === 0) {
    return (
      <SectionCard title="Customer Health">
        <EmptyState
          compact
          title="No company health data"
          description="Health scores across companies will appear here."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Customer Health">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-[color:var(--success)]">{customerHealth.healthy}</span> healthy
          <span className="mx-1.5">·</span>
          <span className="font-semibold text-[color:var(--warning)]">{customerHealth.atRisk}</span> at risk
          <span className="mx-1.5">·</span>
          <span className="font-semibold text-[color:var(--danger)]">{customerHealth.needsAttention}</span> attention
        </p>
        <Link
          href="/companies"
          className="inline-flex items-center text-xs font-medium text-[color:var(--primary)] hover:underline"
        >
          View all
        </Link>
      </div>

      <ul className="mt-3 space-y-2">
        {customerHealth.topCompanies.slice(0, 5).map((c) => (
          <li key={c.id}>
            <Link
              href={`/companies/${c.id}`}
              className="flex items-center gap-2.5 rounded-lg p-1.5 text-sm transition hover:bg-muted"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <HeartPulse className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{c.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {c.industry || "—"} · ${(c.wonRevenue / 1000).toFixed(0)}k won
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${toneDot[c.tone] || "bg-muted"}`} />
                {c.score}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
