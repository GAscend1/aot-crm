"use client";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useLive } from "@/hooks/use-live";
import { Events } from "@/services/events";
import { opportunityService } from "@/services";

export function RecentOpportunities() {
  const { data: opportunities } = useLive(
    () => opportunityService.findAll({ page: 1, pageSize: 5 }).then(r => r.data),
    [
      Events.OPPORTUNITY_CREATED, Events.OPPORTUNITY_UPDATED,
      Events.OPPORTUNITY_DELETED, Events.OPPORTUNITY_WON, Events.OPPORTUNITY_LOST,
    ],
    []
  );

  if (opportunities.length === 0) {
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
        {opportunities.map((opp, index: number) => (
          <div
            key={opp.id}
            className={`flex items-center justify-between px-6 py-3 ${
              index < opportunities.length - 1 ? "border-b border-slate-100" : ""
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
