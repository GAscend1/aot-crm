"use client";

import { History } from "lucide-react";
import { useApiList } from "@/hooks/use-api-list";
import type { UISubscriptionChange } from "@/app/api/platform/subscription-changes/route";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Platform Owner — access audit history. Every manual plan override, trial
 * extension/expiry and suspend/reactivate with changed-by, previous/new plan,
 * source/reason and timestamp.
 */
export function SubscriptionAuditList() {
  const { data, loading, error } = useApiList<UISubscriptionChange>(
    "/api/platform/subscription-changes?pageSize=500",
  );

  if (loading) {
    return (
      <div className="grid gap-3" role="status" aria-label="Loading audit trail">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised p-6 text-center text-sm text-muted-foreground">
        Failed to load the audit trail.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-raised px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <History className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No plan changes recorded</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Manual plan overrides and trial changes appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">When</th>
            <th className="px-4 py-3 font-medium">Organization</th>
            <th className="px-4 py-3 font-medium">Change</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Changed by</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((change) => (
            <tr key={change.id} className="transition-colors hover:bg-muted/40">
              <td className="px-4 py-3 text-muted-foreground">{fmtDate(change.createdAt)}</td>
              <td className="px-4 py-3 font-medium text-foreground">{change.organizationName}</td>
              <td className="px-4 py-3">
                <span className="text-muted-foreground">
                  {change.previousPlan ?? "—"}
                </span>{" "}
                <span aria-hidden>→</span>{" "}
                <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-[color:var(--primary)] ring-1 ring-inset">
                  {change.newPlan}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {change.previousStatus ?? "—"} → {change.newStatus ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{change.source ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{change.reason ?? "—"}</td>
              <td className="px-4 py-3">
                <div className="text-foreground">{change.changedByName ?? "—"}</div>
                {change.changedByEmail && (
                  <div className="text-xs text-muted-foreground">{change.changedByEmail}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
