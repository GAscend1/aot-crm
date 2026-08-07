"use client";

import { TrendingUp, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function RevenueForecast() {
  const { forecast } = useDashboardData();

  if (forecast.months.length === 0) {
    return (
      <SectionCard title="Revenue Forecast">
        <EmptyState
          compact
          title="No forecast yet"
          description="Open deals with an expected close date will appear here."
        />
      </SectionCard>
    );
  }

  const maxValue = Math.max(
    ...forecast.months.map((m) => Math.max(m.committed, m.weighted, m.best)),
    1,
  );

  return (
    <SectionCard title="Revenue Forecast">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--success)]" />
          Committed <strong className="text-foreground">${(forecast.totals.committed / 1000).toFixed(0)}k</strong>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-[color:var(--primary)]" />
          Weighted <strong className="text-foreground">${(forecast.totals.weighted / 1000).toFixed(0)}k</strong>
        </div>
      </div>

      <div className="mt-4 flex items-end gap-2" style={{ height: 120 }}>
        {forecast.months.map((m) => (
          <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">
              ${(m.weighted / 1000).toFixed(0)}k
            </span>
            <div
              className="w-full rounded-t bg-[color:var(--primary)]/80 transition-colors hover:bg-[color:var(--primary)]"
              style={{ height: `${(m.weighted / maxValue) * 100}%` }}
              title={`${m.month}: ${m.weighted.toLocaleString()} weighted`}
            />
            <span className="text-[11px] font-medium text-foreground/70">{m.month}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
