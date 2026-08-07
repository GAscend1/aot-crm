"use client";

import { useMemo, useState } from "react";
import { Building2, Pencil, Shield, Search, Users } from "lucide-react";
import { useApiList } from "@/hooks/use-api-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PLAN_LABELS } from "@/lib/entitlements";
import type { UIOrganization } from "@/app/api/platform/organizations/route";
import { PlanOverrideDialog } from "./PlanOverrideDialog";

const STATUS_STYLES: Record<string, string> = {
  TRIALING: "bg-warning-soft text-[color:var(--warning)]",
  ACTIVE: "bg-success-soft text-[color:var(--success)]",
  EXPIRED: "bg-danger-soft text-[color:var(--danger)]",
  SUSPENDED: "bg-danger-soft text-[color:var(--danger)]",
  CANCELED: "bg-muted text-muted-foreground",
};

const PLAN_STYLES: Record<string, string> = {
  TRIAL: "bg-muted text-muted-foreground",
  STARTER: "bg-primary-soft text-[color:var(--primary)]",
  PROFESSIONAL: "bg-primary-soft text-[color:var(--primary)]",
  ENTERPRISE: "bg-[oklch(0.704_0.191_22.216)]/15 text-[oklch(0.646_0.222_41.116)]",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Platform Owner — Organizations. Every customer workspace with Microsoft
 * tenant id, plan, subscription status, trial window, primary contact, user
 * counts and last activity. Plan override opens the manual control dialog.
 */
export function OrganizationsList() {
  const { data, loading, error, refresh } = useApiList<UIOrganization>(
    "/api/platform/organizations?pageSize=1000",
  );
  const [search, setSearch] = useState("");
  const [overrideOrg, setOverrideOrg] = useState<UIOrganization | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.ownerEmail ?? "").toLowerCase().includes(q) ||
        (o.microsoftTenantId ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  if (loading) {
    return (
      <div className="grid gap-3" role="status" aria-label="Loading organizations">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} organization{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {error ? (
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-center text-sm text-muted-foreground">
          Failed to load organizations.{" "}
          <button onClick={refresh} className="text-[color:var(--primary)] hover:underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-raised px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No organizations yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Workspaces are created automatically when a new Microsoft account
            signs in.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Microsoft tenant</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Trial window</th>
                <th className="px-4 py-3 font-medium">Primary contact</th>
                <th className="px-4 py-3 font-medium">Users</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((org) => (
                <tr key={org.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {org.microsoftTenantId ?? "—"}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        PLAN_STYLES[org.planCode] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {PLAN_LABELS[org.planCode as keyof typeof PLAN_LABELS] ?? org.planCode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        STATUS_STYLES[org.subscriptionStatus] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {org.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org.trialStartedAt
                      ? `${fmtDate(org.trialStartedAt)} → ${fmtDate(org.trialEndsAt)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{org.ownerName ?? org.ownerEmail ?? "—"}</div>
                    {org.ownerName && org.ownerEmail && (
                      <div className="text-xs text-muted-foreground">{org.ownerEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {org.userCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(org.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(org.lastActiveAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOverrideOrg(org);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Set plan
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PlanOverrideDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setOverrideOrg(null);
        }}
        org={overrideOrg}
        onApplied={refresh}
      />
    </div>
  );
}
