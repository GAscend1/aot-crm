"use client";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useLive } from "@/hooks/use-live";
import { Events } from "@/services/events";
import { companyService } from "@/services";

export function RecentCompanies() {
  const { data: companies } = useLive(
    () => companyService.findAll({ page: 1, pageSize: 5 }).then(r => r.data),
    [Events.COMPANY_CREATED, Events.COMPANY_UPDATED, Events.COMPANY_DELETED],
    []
  );

  if (companies.length === 0) {
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
        {companies.map((company: any, index: number) => (
          <div
            key={company.id}
            className={`flex items-center justify-between px-6 py-3 ${
              index < companies.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{company.name}</p>
              <p className="text-xs text-slate-400">{company.industry} · {company.city}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                company.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
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
