"use client";

import { useMemo, useState } from "react";
import { Inbox, Search, Sparkles } from "lucide-react";
import { useApiList } from "@/hooks/use-api-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToastContext } from "@/app/(app)/AppProviders";
import type { UISalesInquiry } from "@/app/api/platform/sales-inquiries/route";
import { RecordModal } from "@/components/common/RecordModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning-soft text-[color:var(--warning)]",
  REVIEWING: "bg-primary-soft text-[color:var(--primary)]",
  LEAD: "bg-primary-soft text-[color:var(--primary)]",
  CONVERTED: "bg-success-soft text-[color:var(--success)]",
  RESOLVED: "bg-muted text-muted-foreground",
  REJECTED: "bg-danger-soft text-[color:var(--danger)]",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DetailState {
  inquiry: UISalesInquiry;
  open: boolean;
}

/**
 * Platform Owner — Request Demo / Contact Sales inquiries. Review and decide:
 * keep pending, mark reviewing/resolved/rejected, or grant a Trial / demo
 * workspace (creates the organization + subscription; never auto-creates an
 * Opportunity).
 */
export function SalesInquiriesTable() {
  const { data, loading, error, refresh } = useApiList<UISalesInquiry>(
    "/api/platform/sales-inquiries?pageSize=500",
  );
  const { success, error: showError } = useToastContext();
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<DetailState>({ inquiry: null as unknown as UISalesInquiry, open: false });
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        (i.company ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  async function updateInquiry(id: string, payload: Record<string, unknown>, message: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/platform/sales-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed");
      }
      success("Inquiry updated", message);
      setDetail((d) => ({ ...d, open: false }));
      refresh();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to update inquiry.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3" role="status" aria-label="Loading inquiries">
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
            placeholder="Search inquiries…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} inquiry{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {error ? (
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-center text-sm text-muted-foreground">
          Failed to load inquiries.{" "}
          <button onClick={refresh} className="text-[color:var(--primary)] hover:underline">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-raised px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No inquiries yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Request Demo / Contact Sales submissions from the public site land here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 text-right font-medium">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((inquiry) => (
                <tr key={inquiry.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{inquiry.name}</div>
                    <div className="text-xs text-muted-foreground">{inquiry.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inquiry.company ?? "—"}
                    {inquiry.companySize ? (
                      <span className="ml-1 text-xs">({inquiry.companySize})</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset">
                      {inquiry.preferredPlan ?? "Not selected"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        STATUS_STYLES[inquiry.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {inquiry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inquiry.source}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(inquiry.submittedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetail({ inquiry, open: true })}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RecordModal
        open={detail.open}
        onClose={() => setDetail((d) => ({ ...d, open: false }))}
        title={`${detail.inquiry?.name} — ${detail.inquiry?.company ?? "Inquiry"}`}
        description={detail.inquiry ? `Received ${fmtDate(detail.inquiry.submittedAt)} · ${detail.inquiry.email}` : undefined}
        size="md"
      >
        {detail.inquiry && (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Company", detail.inquiry.company],
                ["Phone", detail.inquiry.phone],
                ["Company size", detail.inquiry.companySize],
                ["Industry", detail.inquiry.industry],
                ["Intended use", detail.inquiry.intendedUse],
                ["Preferred plan", detail.inquiry.preferredPlan],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 text-foreground">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>

            {detail.inquiry.message && (
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                <div className="text-xs font-medium text-muted-foreground">Message</div>
                <p className="mt-1 text-foreground">{detail.inquiry.message}</p>
              </div>
            )}

            {detail.inquiry.reviewedByName && (
              <p className="text-xs text-muted-foreground">
                Reviewed by {detail.inquiry.reviewedByName}
                {detail.inquiry.reviewedAt ? ` · ${fmtDate(detail.inquiry.reviewedAt)}` : ""}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              {["PENDING", "RESOLVED", "REJECTED"].includes(detail.inquiry.status) && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void updateInquiry(
                      detail.inquiry!.id,
                      { status: "REVIEWING" },
                      "Inquiry marked as reviewing.",
                    )
                  }
                >
                  Start review
                </Button>
              )}
              <Button variant="outline" disabled={busy} onClick={() => setRejectOpen(true)}>
                Reject
              </Button>
              <Button
                variant="default"
                disabled={busy}
                onClick={() =>
                  void updateInquiry(
                    detail.inquiry!.id,
                    { grantTrial: true, notes: "Trial workspace granted by platform owner" },
                    "Trial workspace created. The requester can sign in with their Microsoft account.",
                  )
                }
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Grant trial workspace
              </Button>
            </div>
          </div>
        )}
      </RecordModal>

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject inquiry"
        message={
          <>
            Reject the request from <strong>{detail.inquiry?.name}</strong>? This
            marks it as rejected and is visible to the requester as declined.
          </>
        }
        confirmLabel="Reject"
        variant="danger"
        onConfirm={() =>
          void updateInquiry(
            detail.inquiry!.id,
            { status: "REJECTED" },
            "Inquiry rejected.",
          ).then(() => setRejectOpen(false))
        }
      />
    </div>
  );
}
