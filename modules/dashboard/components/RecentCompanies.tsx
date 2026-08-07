"use client";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function RecentCompanies() {
  const { recentCompanies } = useDashboardData();

  if (recentCompanies.length === 0) {
    return (
      <SectionCard title="Recent Companies">
        <EmptyState
          title="No companies"
          description="Companies will appear here once added."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Companies">
      <div className="-mx-6 -mb-6">
        {recentCompanies.map((company, index: number) => (
          <div
            key={company.id}
            className={`flex items-center justify-between px-6 py-3 ${
              index < recentCompanies.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-foreground">{company.name}</p>
              <p className="text-xs text-muted-foreground">{company.industry} · {company.city}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                company.status === "Active"
                  ? "bg-success-soft text-[color:var(--success)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {company.status}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
