"use client";

import { use } from "react";
import { RecordDetail } from "@/components/enterprise/RecordDetail";
import { opportunityService } from "@/services/index";
import type { Opportunity } from "@/services/opportunity.service";

const stageColors: Record<string, string> = {
  Qualification: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Discovery: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Proposal: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "Closed Won": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "Closed Lost": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <RecordDetail<Opportunity>
      id={id}
      service={opportunityService}
      backHref="/opportunities"
      title="Opportunity"
      getTitle={(o) => o.title}
      getDescription={(o) => o.customer}
      renderFields={(o) => [
        { label: "Customer", value: o.customer || "-" },
        { label: "Value", value: `$${o.value.toLocaleString()}` },
        { label: "Owner", value: o.owner || "-" },
        { label: "Expected Close", value: o.expectedCloseDate || "-" },
        { label: "Probability", value: `${o.probability}%` },
      ]}
      renderStatus={(o) => ({
        label: "Stage",
        value: (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Stage</p>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColors[o.stage] || ""}`}>
                {o.stage}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Status</p>
              <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
                {o.status}
              </span>
            </div>
          </div>
        ),
      })}
      extraSections={(o) =>
        o.notes ? (
          <div className="rounded-xl border bg-white p-6 dark:bg-slate-900 dark:border-slate-700">
            <h3 className="mb-2 font-semibold">Notes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{o.notes}</p>
          </div>
        ) : null
      }
    />
  );
}
