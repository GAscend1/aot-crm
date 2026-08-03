"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Receipt,
  FileUp,
  ClipboardList,
  Eye,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

const quoteStatusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};

const quoteStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

const invoiceStatusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-slate-200 text-slate-500",
};

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

const activityTypeIcons: Record<string, React.ElementType> = {
  Call: Phone,
  Email: Mail,
  Meeting: Calendar,
  Task: CheckCircle2,
  Note: ClipboardList,
  Comment: ClipboardList,
};

const moneyFmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

/* ------------------------------------------------------------------ */
/* Related Quotes                                                      */
/* ------------------------------------------------------------------ */

interface RelatedQuote {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

export function RelatedQuotesSection({
  opportunityId,
  refreshKey = 0,
  onConvert,
  compact = false,
}: {
  opportunityId: string;
  refreshKey?: number;
  onConvert?: (quoteId: string, quoteNumber: string) => void;
  /** Compact list (max 3 rows) used by the opportunity modal inspector. */
  compact?: boolean;
}) {
  const [quotes, setQuotes] = useState<RelatedQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/quotes?filters=${encodeURIComponent(JSON.stringify({ opportunityId }))}&pageSize=50`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: RelatedQuote[] }) => {
        if (!cancelled) {
          setQuotes(body.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, refreshKey]);

  if (compact) {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Quotes ({quotes.length})
          </p>
          <Link href={`/quotes?opportunityId=${opportunityId}`} className="text-[11px] font-medium text-[color:var(--info)] hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-1.5">
            <div className="h-7 animate-pulse rounded-md bg-muted" />
            <div className="h-7 animate-pulse rounded-md bg-muted" />
          </div>
        ) : quotes.length === 0 ? (
          <p className="py-1 text-xs text-muted-foreground">No quotes yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border">
            {quotes.slice(0, 3).map((q) => (
              <li key={q.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300">
                  <FileText className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/quotes/${q.id}`} className="truncate text-xs font-medium text-foreground hover:text-[color:var(--info)]">
                      {q.quoteNumber}
                    </Link>
                    <span className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium ${quoteStatusColors[q.status]}`}>
                      {quoteStatusLabels[q.status]}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-foreground">{moneyFmt(q.total)}</span>
                {onConvert && q.status === "ACCEPTED" && (
                  <button
                    onClick={() => onConvert(q.id, q.quoteNumber)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[color:var(--success)] transition-colors hover:bg-success-soft"
                    title="Convert to invoice"
                  >
                    <Receipt className="h-3 w-3" />
                  </button>
                )}
                <Link
                  href={`/quotes/${q.id}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Open quote"
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            ))}
            {quotes.length > 3 && (
              <li className="px-2.5 py-1.5">
                <Link href={`/quotes?opportunityId=${opportunityId}`} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
                  +{quotes.length - 3} more
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quotes ({quotes.length})</h3>
        <Link href={`/quotes?opportunityId=${opportunityId}`} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState title="No quotes yet" description="Create a quote from the quick actions." />
      ) : (
        <div className="divide-y rounded-lg border dark:divide-slate-800 dark:border-slate-700">
          {quotes.map((q) => (
            <div key={q.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/quotes/${q.id}`} className="truncate text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-white">
                    {q.quoteNumber}
                  </Link>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${quoteStatusColors[q.status]}`}>
                    {quoteStatusLabels[q.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{moneyFmt(q.total)}</span>
              {onConvert && q.status === "ACCEPTED" && (
                <button
                  onClick={() => onConvert(q.id, q.quoteNumber)}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:border-slate-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  title="Convert to invoice"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Convert
                </button>
              )}
              <Link
                href={`/quotes/${q.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                title="Open quote"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Related Invoices                                                    */
/* ------------------------------------------------------------------ */

interface RelatedInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
  createdAt: string;
}

export function RelatedInvoicesSection({
  opportunityId,
  refreshKey = 0,
  compact = false,
}: {
  opportunityId: string;
  refreshKey?: number;
  /** Compact list (max 3 rows) used by the opportunity modal inspector. */
  compact?: boolean;
}) {
  const [invoices, setInvoices] = useState<RelatedInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/invoices?filters=${encodeURIComponent(JSON.stringify({ opportunityId }))}&pageSize=50`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: RelatedInvoice[] }) => {
        if (!cancelled) {
          setInvoices(body.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, refreshKey]);

  if (compact) {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Invoices ({invoices.length})
          </p>
          <Link href={`/invoices?opportunityId=${opportunityId}`} className="text-[11px] font-medium text-[color:var(--success)] hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-1.5">
            <div className="h-7 animate-pulse rounded-md bg-muted" />
            <div className="h-7 animate-pulse rounded-md bg-muted" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="py-1 text-xs text-muted-foreground">No invoices yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border">
            {invoices.slice(0, 3).map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <Receipt className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/invoices/${inv.id}`} className="truncate text-xs font-medium text-foreground hover:text-[color:var(--success)]">
                      {inv.invoiceNumber}
                    </Link>
                    <span className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium ${invoiceStatusColors[inv.status]}`}>
                      {invoiceStatusLabels[inv.status]}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Due {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-foreground">{moneyFmt(inv.total)}</span>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Open invoice"
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            ))}
            {invoices.length > 3 && (
              <li className="px-2.5 py-1.5">
                <Link href={`/invoices?opportunityId=${opportunityId}`} className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
                  +{invoices.length - 3} more
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Invoices ({invoices.length})</h3>
        <Link href={`/invoices?opportunityId=${opportunityId}`} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="Convert an accepted quote to create an invoice." />
      ) : (
        <div className="divide-y rounded-lg border dark:divide-slate-800 dark:border-slate-700">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/invoices/${inv.id}`} className="truncate text-sm font-medium text-slate-900 hover:text-emerald-600 dark:text-white">
                    {inv.invoiceNumber}
                  </Link>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${invoiceStatusColors[inv.status]}`}>
                    {invoiceStatusLabels[inv.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Due {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{moneyFmt(inv.total)}</span>
              <Link
                href={`/invoices/${inv.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                title="Open invoice"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Related Documents                                                   */
/* ------------------------------------------------------------------ */

interface RelatedDocument {
  id: string;
  name: string;
  type: string | null;
  size: number | null;
  createdAt: string;
  uploadedByName: string | null;
}

export function RelatedDocumentsSection({
  opportunityId,
  refreshKey = 0,
  compact = false,
  onUpload,
}: {
  opportunityId: string;
  refreshKey?: number;
  /** Compact list (max 3 rows) used by the opportunity modal inspector. */
  compact?: boolean;
  /** Opens the upload dialog from the compact list's Upload action. */
  onUpload?: () => void;
}) {
  const [documents, setDocuments] = useState<RelatedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/opportunities/${opportunityId}/attachments`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: RelatedDocument[] }) => {
        if (!cancelled) {
          setDocuments(body.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, refreshKey]);

  const handleOpen = async (doc: RelatedDocument) => {
    setDownloading(doc.id);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/download/${doc.id}`);
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error || "Download failed");
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch {
      /* silently ignore — no toast context here */
    } finally {
      setDownloading(null);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (compact) {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Documents ({documents.length})
          </p>
          <div className="flex items-center gap-2.5">
            {onUpload && (
              <button
                type="button"
                onClick={onUpload}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--info)] transition-colors hover:underline"
              >
                <Plus className="h-3 w-3" />
                Upload
              </button>
            )}
            <Link href="/documents" className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              View all
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="space-y-1.5">
            <div className="h-7 animate-pulse rounded-md bg-muted" />
            <div className="h-7 animate-pulse rounded-md bg-muted" />
          </div>
        ) : documents.length === 0 ? (
          <p className="py-1 text-xs text-muted-foreground">No documents yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border">
            {documents.slice(0, 3).map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-300">
                  <FileUp className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{doc.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {doc.type || "Other"}
                    {doc.size ? ` · ${formatSize(doc.size)}` : ""}
                    {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""} · {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => void handleOpen(doc)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Preview / download"
                >
                  {downloading === doc.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </button>
              </li>
            ))}
            {documents.length > 3 && (
              <li className="px-2.5 py-1.5">
                <Link href="/documents" className="text-[11px] font-medium text-muted-foreground hover:text-foreground">
                  +{documents.length - 3} more
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Documents ({documents.length})</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState title="No documents yet" description="Upload proposals, contracts, and NDAs." />
      ) : (
        <div className="divide-y rounded-lg border dark:divide-slate-800 dark:border-slate-700">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300">
                <FileUp className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{doc.name}</p>
                <p className="text-xs text-slate-400">
                  {doc.type || "Other"}
                  {doc.size ? ` · ${formatSize(doc.size)}` : ""} · {doc.uploadedByName || "Uploaded"} ·{" "}
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => void handleOpen(doc)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                title="Preview / download"
              >
                {downloading === doc.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Related Activities                                                  */
/* ------------------------------------------------------------------ */

interface RelatedActivity {
  id: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  owner: string;
}

export function RelatedActivitiesSection({ opportunityId, refreshKey = 0 }: { opportunityId: string; refreshKey?: number }) {
  const [activities, setActivities] = useState<RelatedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/activities?opportunityId=${opportunityId}&pageSize=50`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: RelatedActivity[] }) => {
        if (!cancelled) {
          setActivities(body.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, refreshKey]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Activities ({activities.length})</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState title="No activities yet" description="Log calls, meetings, and emails from quick actions." />
      ) : (
        <div className="divide-y rounded-lg border dark:divide-slate-800 dark:border-slate-700">
          {activities.map((a) => {
            const Icon = activityTypeIcons[a.type] ?? ClipboardList;
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{a.subject}</p>
                  <p className="truncate text-xs text-slate-400">
                    {a.type}
                    {a.description ? ` · ${a.description}` : ""} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    a.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : a.status === "Cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
