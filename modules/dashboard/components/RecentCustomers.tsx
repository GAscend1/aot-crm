"use client";

import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useLive } from "@/hooks/use-live";
import { Events } from "@/services/events";
import { customerService } from "@/services";

export function RecentCustomers() {
  const { data: customers } = useLive(
    () => customerService.findAll({ page: 1, pageSize: 5 }).then(r => r.data),
    [Events.CUSTOMER_CREATED, Events.CUSTOMER_UPDATED, Events.CUSTOMER_DELETED],
    []
  );

  if (customers.length === 0) {
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
        {customers.map((customer: any, index: number) => (
          <div
            key={customer.id}
            className={`flex items-center justify-between px-6 py-3 ${
              index < customers.length - 1 ? "border-b border-slate-100" : ""
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
