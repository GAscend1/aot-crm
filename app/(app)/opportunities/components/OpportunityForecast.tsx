"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, DollarSign, Trophy, TrendingUp } from "lucide-react";

import { opportunityService } from "@/services/index";
import type { Opportunity } from "@/services/opportunity.service";
import { OPPORTUNITY_STAGES, stageDotVar } from "../stageConfig";
import { OpportunityWorkspace } from "./OpportunityWorkspace";
import { cn } from "@/lib/utils";

const moneyFmt = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const ACTIVE_STAGES = OPPORTUNITY_STAGES.filter(
  (s) => s !== "Closed Won" && s !== "Closed Lost"
);

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-3.5 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-soft text-[color:var(--info)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <p className="truncate text-lg font-bold text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * Compact weighted forecast for the Opportunities module.
 * Loads only the core opportunity rows (no related records).
 */
export function OpportunityForecast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    opportunityService.findAll().then((result) => {
      setOpportunities(result.data);
      setLoading(false);
    });
  }, []);

  const openDeals = useMemo(
    () => opportunities.filter((o) => o.status === "Open"),
    [opportunities]
  );

  const pipelineValue = openDeals.reduce((sum, o) => sum + (o.value ?? 0), 0);
  const weightedForecast = openDeals.reduce(
    (sum, o) => sum + ((o.value ?? 0) * (o.probability ?? 0)) / 100,
    0
  );
  const wonValue = opportunities
    .filter((o) => o.status === "Won")
    .reduce((sum, o) => sum + (o.value ?? 0), 0);

  const closingSoon = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 30);
    return openDeals
      .filter((o) => {
        if (!o.expectedCloseDate) return false;
        const d = new Date(o.expectedCloseDate);
        return d >= today && d <= horizon;
      })
      .sort(
        (a, b) =>
          new Date(a.expectedCloseDate).getTime() -
          new Date(b.expectedCloseDate).getTime()
      );
  }, [openDeals]);

  const closingSoonValue = closingSoon.reduce(
    (sum, o) => sum + (o.value ?? 0),
    0
  );

  const stageRows = ACTIVE_STAGES.map((stage) => {
    const deals = openDeals.filter((o) => o.stage === stage);
    const value = deals.reduce((sum, o) => sum + (o.value ?? 0), 0);
    const weighted = deals.reduce(
      (sum, o) => sum + ((o.value ?? 0) * (o.probability ?? 0)) / 100,
      0
    );
    return { stage, count: deals.length, value, weighted };
  });

  const maxStageValue = Math.max(
    1,
    ...stageRows.map((row) => row.value)
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={DollarSign}
          label="Pipeline Value"
          value={moneyFmt(pipelineValue)}
        />
        <Metric
          icon={TrendingUp}
          label="Weighted Forecast"
          value={moneyFmt(weightedForecast)}
        />
        <Metric icon={Trophy} label="Won Revenue" value={moneyFmt(wonValue)} />
        <Metric
          icon={CalendarClock}
          label="Closing in 30 Days"
          value={`${closingSoon.length} · ${moneyFmt(closingSoonValue)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Stage breakdown */}
        <section className="rounded-xl border border-border bg-surface-raised lg:col-span-3">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Pipeline by Stage
            </h2>
          </div>
          <div className="divide-y divide-border">
            {stageRows.map((row) => (
              <div key={row.stage} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
                <div className="col-span-5 flex min-w-0 items-center gap-2 sm:col-span-4">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: stageDotVar[row.stage] }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium text-foreground">
                    {row.stage}
                  </span>
                </div>
                <span className="col-span-2 text-right text-xs text-muted-foreground tabular-nums">
                  {row.count} deal{row.count === 1 ? "" : "s"}
                </span>
                <div className="col-span-5 flex items-center gap-2">
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[color:var(--info)] transition-all duration-300"
                      style={{ width: `${(row.value / maxStageValue) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs font-semibold text-foreground tabular-nums">
                    {moneyFmt(row.value)}
                  </span>
                  <span className="hidden w-20 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums sm:block">
                    {moneyFmt(row.weighted)} weighted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing soon */}
        <section className="rounded-xl border border-border bg-surface-raised lg:col-span-2">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Deals Closing Soon
            </h2>
          </div>
          <div className="divide-y divide-border">
            {closingSoon.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No deals expected to close in the next 30 days.
              </p>
            ) : (
              closingSoon.map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/opportunities?view=forecast&record=${encodeURIComponent(deal.id)}`,
                      { scroll: false }
                    )
                  }
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {deal.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {deal.customer} · {new Date(deal.expectedCloseDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {moneyFmt(deal.value)}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] tabular-nums",
                        deal.expectedCloseDate &&
                          new Date(deal.expectedCloseDate).getTime() -
                            new Date().getTime() <=
                            7 * 24 * 60 * 60 * 1000
                          ? "font-semibold text-[color:var(--warning)]"
                          : "text-muted-foreground"
                      )}
                    >
                      {deal.probability}% prob
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <OpportunityWorkspace
        key={searchParams?.get("record") ? `record:${searchParams.get("record")}` : "closed"}
        siblings={opportunities.map((o) => ({ id: o.id, title: o.title }))}
        onChanged={() => {
          opportunityService.findAll().then((result) => {
            setOpportunities(result.data);
          });
        }}
      />
    </div>
  );
}
