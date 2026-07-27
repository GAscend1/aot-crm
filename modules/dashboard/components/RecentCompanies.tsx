import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";

import { recentCompanies } from "../mockData";

export function RecentCompanies() {
  if (recentCompanies.length === 0) {
    return (
      <SectionCard title="Recent Companies">
        <EmptyState
          title="No companies yet"
          description="New companies will appear here once added."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Companies">
      <div className="-mx-6 -mb-6">
        {recentCompanies.map((company, index) => (
          <div
            key={company.id}
            className={`flex items-center justify-between px-6 py-3.5 ${
              index < recentCompanies.length - 1
                ? "border-b border-slate-100"
                : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">
                {company.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {company.industry} · {company.city}, {company.country}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  company.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {company.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
