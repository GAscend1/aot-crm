import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricStripItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: string;
}

/**
 * Compact horizontal metric strip — one slim row instead of a grid of
 * oversized KPI cards. Designed for record inspector / workspace headers.
 */
export function MetricStrip({ items }: { items: MetricStripItem[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-px overflow-hidden rounded-xl border border-border bg-border">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-[110px] flex-1 items-center gap-2.5 bg-surface-raised px-3 py-2"
          >
            {Icon && (
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                  item.tone && `bg-[color:var(${item.tone})]/[0.1] text-[color:var(${item.tone})]`
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {item.label}
              </p>
              <p className="truncate text-sm font-semibold text-foreground tabular-nums">
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
