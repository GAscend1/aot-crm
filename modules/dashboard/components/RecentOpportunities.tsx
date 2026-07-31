"use client";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function RecentOpportunities() {
  const { recentOpportunities } = useDashboardData();

  if (recentOpportunities.length === 0) {
    return (
      <SectionCard title="Recent Opportunities">
        <EmptyState
          title="No opportunities"
          description="Opportunities will appear here once created."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Opportunities">
      <div className="-mx-6 -mb-6">
        {recentOpportunities.map((opp, index: number) => (
          <div
            key={opp.id}
            className={`flex items-center justify-between px-6 py-3 ${
              index < recentOpportunities.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{opp.title}</p>
              <p className="text-xs text-slate-400">
                {opp.customer} · ${opp.value?.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 rounded-full bg-slate-200">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${opp.probability || 0}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{opp.stage}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
