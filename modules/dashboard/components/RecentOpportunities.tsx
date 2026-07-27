import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";

import { recentOpportunities } from "../mockData";

export function RecentOpportunities() {
  if (recentOpportunities.length === 0) {
    return (
      <SectionCard title="Recent Opportunities">
        <EmptyState
          title="No opportunities yet"
          description="New opportunities will appear here once created."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Opportunities">
      <div className="-mx-6 -mb-6">
        {recentOpportunities.map((opportunity, index) => (
          <div
            key={opportunity.id}
            className={`px-6 py-3.5 ${
              index < recentOpportunities.length - 1
                ? "border-b border-slate-100"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">
                {opportunity.title}
              </p>
              <span className="text-sm font-semibold text-slate-900">
                ${opportunity.value.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {opportunity.customer}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                {opportunity.stage}
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                {opportunity.probability}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
