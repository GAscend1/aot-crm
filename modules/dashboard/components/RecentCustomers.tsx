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
              index < recentCustomers.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-foreground">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{customer.company}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                customer.status === "Active"
                  ? "bg-success-soft text-[color:var(--success)]"
                  : customer.status === "Prospect"
                  ? "bg-primary-soft text-[color:var(--primary)]"
                  : "bg-muted text-muted-foreground"
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
