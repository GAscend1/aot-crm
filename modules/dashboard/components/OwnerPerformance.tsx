"use client";

import { Trophy, Users } from "lucide-react";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function OwnerPerformance() {
  const { topOwners } = useDashboardData();

  if (topOwners.length === 0) {
    return (
      <SectionCard title="Owner Performance">
        <EmptyState
          compact
          title="No owner data yet"
          description="Won revenue by owner will appear here."
        />
      </SectionCard>
    );
  }

  const maxValue = Math.max(...topOwners.map((o) => o.wonValue), 1);

  return (
    <SectionCard title="Owner Performance">
      <div className="space-y-4">
        {topOwners.map((owner, index) => (
          <div key={owner.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-700">
                {index === 0 && <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                <span className="truncate font-medium">{owner.name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                ${(owner.wonValue / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${(owner.wonValue / maxValue) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {owner.wonCount} won
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {owner.activeDeals} active
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
