import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";

import { recentCustomers } from "../mockData";

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-slate-100 text-slate-700",
  Prospect: "bg-blue-100 text-blue-700",
} as const;

export function RecentCustomers() {
  if (recentCustomers.length === 0) {
    return (
      <SectionCard title="Recent Customers">
        <EmptyState
          title="No customers yet"
          description="New customers will appear here once added."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent Customers">
      <div className="-mx-6 -mb-6">
        {recentCustomers.map((customer, index) => (
          <div
            key={customer.id}
            className={`flex items-center justify-between px-6 py-3.5 ${
              index < recentCustomers.length - 1
                ? "border-b border-slate-100"
                : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">
                {customer.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {customer.company}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[customer.status]
                }`}
              >
                {customer.status}
              </span>
              <span className="text-xs text-slate-400">
                {customer.createdAt}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
