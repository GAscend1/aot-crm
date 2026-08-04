"use client";

import { cn } from "@/lib/utils";

export interface ViewTab {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: string;
}

interface ViewSwitcherProps {
  tabs: ViewTab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  /** Optional prefix for data-tour attributes, e.g. "view-kanban". */
  tourPrefix?: string;
}

/**
 * Compact segmented control for switching a module between views
 * (e.g. Opportunities: List / Kanban / Forecast).
 */
export function ViewSwitcher({
  tabs,
  active,
  onChange,
  className,
  tourPrefix,
}: ViewSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="View"
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-surface-raised p-1 scrollbar-thin",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            data-tour={tourPrefix ? `${tourPrefix}-${tab.id}` : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected
                ? "bg-[color:var(--primary)] text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {tab.label}
            {tab.badge && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold tabular-nums">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
