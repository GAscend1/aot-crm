"use client";

import { cn } from "@/lib/utils";

export interface EntityTab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface EntityTabsProps {
  tabs: EntityTab[];
  active: string;
  onChange: (id: string) => void;
  id: string;
  className?: string;
}

/**
 * Generic accessible tab bar for the 360 record pages. Keyboard navigable
 * (arrow keys), with aria roles wired to each panel's labelledby.
 */
export function EntityTabs({ tabs, active, onChange, id, className }: EntityTabsProps) {
  const tablistId = `${id}-tabs`;

  return (
    <div
      role="tablist"
      aria-label="Record sections"
      id={tablistId}
      className={cn(
        "flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border bg-surface-raised px-3",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.id;
        const panelId = `${id}-panel-${tab.id}`;
        const buttonId = `${id}-tab-${tab.id}`;
        return (
          <button
            key={tab.id}
            id={buttonId}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={panelId}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const index = tabs.findIndex((t) => t.id === active);
                const next =
                  e.key === "ArrowRight"
                    ? (index + 1) % tabs.length
                    : (index - 1 + tabs.length) % tabs.length;
                onChange(tabs[next].id);
              }
            }}
            className={cn(
              "relative flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden="true" />}
            {tab.label}
            <span
              className={cn(
                "absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[color:var(--info)] transition-opacity duration-150",
                selected ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
