"use client";

import * as React from "react";
import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RelatedRecordItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  icon?: LucideIcon;
  onOpen?: () => void;
}

interface RelatedRecordsListProps {
  items: RelatedRecordItem[];
  emptyMessage?: string;
  compact?: boolean;
  className?: string;
}

export function RelatedRecordsList({
  items,
  emptyMessage = "Nothing here yet.",
  compact,
  className,
}: RelatedRecordsListProps) {
  if (items.length === 0) {
    return (
      <p className={cn("rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground", compact && "py-3")}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={cn("divide-y rounded-lg border", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const Wrapper = item.onOpen ? "button" : "div";
        return (
          <li key={item.id}>
            <Wrapper
              type={item.onOpen ? "button" : undefined}
              onClick={item.onOpen}
              className={cn(
                "flex w-full items-center gap-3 px-3 text-left",
                compact ? "py-2" : "py-2.5",
                item.onOpen &&
                  "transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              {Icon && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {item.title}
                </span>
                {(item.subtitle || item.meta) && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.subtitle}
                    {item.subtitle && item.meta ? " · " : ""}
                    {item.meta}
                  </span>
                )}
              </span>
              {item.badge}
              {item.onOpen && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
            </Wrapper>
          </li>
        );
      })}
    </ul>
  );
}
