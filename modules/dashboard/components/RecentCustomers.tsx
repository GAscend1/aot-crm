"use client";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export function RecentCustomers() {
  const { recentCustomers } = useDashboardData();

  if (recentCustomers.length === 0) {
    return (
      <SectionCard title="Recent Customers">
        <EmptyState
          title="No customers"
          description="Customers will appear here once added."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Customers">
      <div className="-mx-6 -mb-6">
        {recentCustomers.map((customer, index: number) => (
          <div
            key={customer.id}
            className={`flex items-center justify-between px-6 py-3 ${
              index < recentCustomers.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{customer.name}</p>
              <p className="text-xs text-slate-400">{customer.company}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                customer.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : customer.status === "Prospect"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {customer.status}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
