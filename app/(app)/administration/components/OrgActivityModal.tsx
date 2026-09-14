"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  X,
  Loader2,
  Activity,
  Calendar,
  Users,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ActivityEntry {
  id: string;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string | null;
}

interface ActivitySummary {
  organizationId: string;
  organizationName: string;
  totalActivities: number;
  activeUsers: number;
  totalUsers: number;
  lastActivityAt: string | null;
  createdAt: string | null;
  planCode: string | null;
  subscriptionStatus: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
}

interface ActivityResponse {
  data: ActivityEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: ActivitySummary;
}

const MODULE_OPTIONS = [
  "All",
  "Leads",
  "Opportunities",
  "Customers",
  "Companies",
  "Contacts",
  "Activities",
  "Calendar",
  "Email",
  "Tickets",
  "Documents",
  "Quotes",
  "Invoices",
  "Reports",
  "Administration",
  "Auth",
  "Onboarding",
];

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-success-soft text-[color:var(--success)]",
  created: "bg-success-soft text-[color:var(--success)]",
  UPDATE: "bg-info-soft text-[color:var(--info)]",
  updated: "bg-info-soft text-[color:var(--info)]",
  DELETE: "bg-danger-soft text-[color:var(--danger)]",
  deleted: "bg-danger-soft text-[color:var(--danger)]",
  archived: "bg-warning-soft text-[color:var(--warning)]",
  VIEW: "bg-muted text-muted-foreground",
  LOGIN: "bg-primary-soft text-[color:var(--primary)]",
  LOGOUT: "bg-muted text-muted-foreground",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface OrgActivityModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

/**
 * Organization Activity Modal — Platform Owner view of org audit history.
 * Shows summary stats, filters, and a paginated activity timeline.
 */
export function OrgActivityModal({
  open,
  onClose,
  organizationId,
}: OrgActivityModalProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moduleFilter, setModuleFilter] = useState("All");
  const [userFilter] = useState("");

  const fetchData = useCallback(async (pageNum: number, mod: string, uid: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: "30",
      });
      if (mod && mod !== "All") {
        params.set("module", mod);
      }
      if (uid) {
        params.set("userId", uid);
      }
      const res = await fetch(
        `/api/platform/organizations/${organizationId}/activity?${params}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Failed to load activity");
      const body: ActivityResponse = await res.json();
      setEntries(body.data);
      setTotal(body.total);
      setTotalPages(body.totalPages);
      setSummary(body.summary);
    } catch {
      setEntries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Fetch on open or when filters/page change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) void fetchData(page, moduleFilter, userFilter);
  }, [open, page, moduleFilter, userFilter, fetchData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleModuleChange = (value: string) => {
    setModuleFilter(value);
    setPage(1);
  };

  if (!open) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-[1100px] max-h-[85vh] flex-col rounded-xl border bg-surface-raised shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-foreground">
                  Organization Activity
                </h2>
                {summary && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {summary.organizationName}
                  </p>
                )}
              </div>
              <DialogPrimitive.Close
                render={
                  <button
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close"
                  />
                }
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading && !summary ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : summary ? (
                <div className="space-y-5">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryCard
                      icon={Calendar}
                      label="Created"
                      value={fmtDate(summary.createdAt)}
                    />
                    <SummaryCard
                      icon={Clock}
                      label="Last Active"
                      value={
                        summary.lastActivityAt
                          ? fmtDateTime(summary.lastActivityAt)
                          : "Never"
                      }
                    />
                    <SummaryCard
                      icon={Users}
                      label="Users"
                      value={`${summary.activeUsers} active / ${summary.totalUsers} total`}
                    />
                    <SummaryCard
                      icon={Activity}
                      label="Total Activities"
                      value={String(summary.totalActivities)}
                    />
                  </div>

                  {/* Plan/Trial info */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      Plan:{" "}
                      <span className="font-medium text-foreground">
                        {summary.planCode ?? "—"}
                      </span>
                    </span>
                    <span>
                      Status:{" "}
                      <span className="font-medium text-foreground">
                        {summary.subscriptionStatus ?? "—"}
                      </span>
                    </span>
                    {summary.trialStartedAt && (
                      <span>
                        Trial:{" "}
                        <span className="font-medium text-foreground">
                          {fmtDate(summary.trialStartedAt)} →{" "}
                          {fmtDate(summary.trialEndsAt)}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Historical data notice */}
                  <div className="rounded-lg border border-warning/30 bg-warning-soft/30 px-4 py-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Note:</span>{" "}
                    Historical module-view telemetry was not previously recorded.
                    Activity data shown reflects CRUD operations and audit events
                    that were already being logged. Going forward, module access
                    events will be captured automatically.
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={moduleFilter} onValueChange={handleModuleChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Module" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULE_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">
                      {total} total records
                    </span>
                  </div>

                  {/* Activity timeline */}
                  {entries.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted-foreground">
                      <Activity className="h-8 w-8" />
                      <p>No activity records found for the selected filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-start gap-3 border-b border-border px-1 py-3 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {entry.userEmail ?? "System"}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                  ACTION_STYLES[entry.action] ??
                                    "bg-muted text-muted-foreground",
                                )}
                              >
                                {entry.action}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {entry.module}
                              </span>
                            </div>
                            {entry.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {entry.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                            {fmtDateTime(entry.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t px-5 py-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
