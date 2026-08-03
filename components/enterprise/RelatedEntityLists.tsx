"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared row rendering                                               */
/* ------------------------------------------------------------------ */

interface RelatedItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  href?: string;
}

function RelatedList({
  items,
  emptyMessage,
}: {
  items: RelatedItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-3 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((item) => (
        <li key={item.id}>
          {item.href ? (
            <Link
              href={item.href}
              className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.badge}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {item.title}
                </span>
                {(item.subtitle || item.meta) && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.subtitle}
                    {item.subtitle && item.meta ? " · " : ""}
                    {item.meta}
                  </span>
                )}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          ) : (
            <div className="flex w-full items-center gap-3 px-3 py-2">
              {item.badge}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {item.title}
                </span>
                {(item.subtitle || item.meta) && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.subtitle}
                    {item.subtitle && item.meta ? " · " : ""}
                    {item.meta}
                  </span>
                )}
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function SectionCard({
  title,
  count,
  viewAllHref,
  children,
}: {
  title: string;
  count: number;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-surface-raised">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">
          {title}
          {count > 0 ? (
            <span className="ml-1 text-muted-foreground">({count})</span>
          ) : null}
        </h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-[color:var(--primary)] hover:underline"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-6">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );
}

const pill = (className: string, label: string) => (
  <span
    className={cn(
      "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
      className
    )}
  >
    {label}
  </span>
);

const statusPill = (status: string, tones: Record<string, string>) =>
  pill(tones[status] ?? "bg-slate-100 text-slate-700", status);

const quoteTones: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};

const invoiceTones: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-slate-200 text-slate-500",
};

const stagePill = (stage: string) => {
  const map: Record<string, string> = {
    "Discovery": "bg-blue-100 text-blue-700",
    "Qualification": "bg-slate-100 text-slate-700",
    "Proposal": "bg-amber-100 text-amber-700",
    "Negotiation": "bg-purple-100 text-purple-700",
    "Closed Won": "bg-emerald-100 text-emerald-700",
    "Closed Lost": "bg-red-100 text-red-700",
  };
  return pill(map[stage] ?? "bg-slate-100 text-slate-700", stage);
};

const moneyFmt = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

/* ------------------------------------------------------------------ */
/* Related Opportunities                                              */
/* ------------------------------------------------------------------ */

export function RelatedOpportunitiesList({
  customerId,
  companyId,
  limit = 5,
}: {
  customerId?: string;
  companyId?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const filters: Record<string, string> = {};
    if (customerId) filters.customerId = customerId;
    if (companyId) filters.companyId = companyId;
    const qs = Object.keys(filters).length
      ? `&filters=${encodeURIComponent(JSON.stringify(filters))}`
      : "";
    fetch(`/api/opportunities?${qs}&pageSize=${limit}&sortBy=updatedAt`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: any[] }) => {
        if (cancelled) return;
        setItems(
          (body.data ?? []).map((o) => ({
            id: o.id,
            title: o.title,
            subtitle: o.customer,
            meta: o.value != null ? moneyFmt(o.value) : undefined,
            badge: stagePill(o.stage),
            href: `/opportunities?record=${encodeURIComponent(o.id)}`,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, companyId, limit]);

  return (
    <SectionCard title="Opportunities" count={items.length} viewAllHref="/opportunities">
      {loading ? (
        <Loading />
      ) : (
        <RelatedList items={items} emptyMessage="No opportunities yet." />
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Related Quotes                                                     */
/* ------------------------------------------------------------------ */

export function RelatedQuotesList({
  customerId,
  companyId,
  limit = 5,
}: {
  customerId?: string;
  companyId?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const filters: Record<string, string> = {};
    if (customerId) filters.customerId = customerId;
    if (companyId) filters.companyId = companyId;
    const qs = Object.keys(filters).length
      ? `&filters=${encodeURIComponent(JSON.stringify(filters))}`
      : "";
    fetch(`/api/quotes?${qs}&pageSize=${limit}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: any[] }) => {
        if (cancelled) return;
        setItems(
          (body.data ?? []).map((q) => ({
            id: q.id,
            title: q.quoteNumber,
            subtitle: q.createdAt
              ? new Date(q.createdAt).toLocaleDateString()
              : undefined,
            meta: q.total != null ? moneyFmt(q.total) : undefined,
            badge: statusPill(q.status ?? "DRAFT", quoteTones),
            href: `/quotes?record=${encodeURIComponent(q.id)}`,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, companyId, limit]);

  return (
    <SectionCard title="Quotes" count={items.length} viewAllHref="/quotes">
      {loading ? (
        <Loading />
      ) : (
        <RelatedList items={items} emptyMessage="No quotes yet." />
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Related Invoices                                                   */
/* ------------------------------------------------------------------ */

export function RelatedInvoicesList({
  customerId,
  companyId,
  limit = 5,
}: {
  customerId?: string;
  companyId?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const filters: Record<string, string> = {};
    if (customerId) filters.customerId = customerId;
    if (companyId) filters.companyId = companyId;
    const qs = Object.keys(filters).length
      ? `&filters=${encodeURIComponent(JSON.stringify(filters))}`
      : "";
    fetch(`/api/invoices?${qs}&pageSize=${limit}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: any[] }) => {
        if (cancelled) return;
        setItems(
          (body.data ?? []).map((inv) => ({
            id: inv.id,
            title: inv.invoiceNumber,
            subtitle: inv.dueDate
              ? `Due ${new Date(inv.dueDate).toLocaleDateString()}`
              : undefined,
            meta: inv.total != null ? moneyFmt(inv.total) : undefined,
            badge: statusPill(inv.status ?? "DRAFT", invoiceTones),
            href: `/invoices?record=${encodeURIComponent(inv.id)}`,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, companyId, limit]);

  return (
    <SectionCard title="Invoices" count={items.length} viewAllHref="/invoices">
      {loading ? (
        <Loading />
      ) : (
        <RelatedList items={items} emptyMessage="No invoices yet." />
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Related Activities                                                 */
/* ------------------------------------------------------------------ */

export function RelatedActivitiesList({
  customerId,
  companyId,
  limit = 5,
  refreshKey = 0,
}: {
  customerId?: string;
  companyId?: string;
  limit?: number;
  refreshKey?: number;
}) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("pageSize", String(limit));
    if (customerId) params.set("customerId", customerId);
    if (companyId) params.set("companyId", companyId);
    fetch(`/api/activities?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: any[] }) => {
        if (cancelled) return;
        setItems(
          (body.data ?? []).map((a) => ({
            id: a.id,
            title: a.subject,
            subtitle: a.type,
            meta: a.createdAt
              ? new Date(a.createdAt).toLocaleDateString()
              : undefined,
            badge: pill(
              a.status === "Completed"
                ? "bg-emerald-100 text-emerald-700"
                : a.status === "Cancelled"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700",
              a.status ?? ""
            ),
            href: `/activities?record=${encodeURIComponent(a.id)}`,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, companyId, limit, refreshKey]);

  return (
    <SectionCard title="Recent Activities" count={items.length} viewAllHref="/activities">
      {loading ? (
        <Loading />
      ) : (
        <RelatedList items={items} emptyMessage="No activities yet." />
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Related Customers (used on the Company workspace)                  */
/* ------------------------------------------------------------------ */

export function RelatedCustomersList({
  companyId,
  limit = 5,
}: {
  companyId?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/customers?filters=${encodeURIComponent(JSON.stringify({ companyId }))}&pageSize=${limit}`,
      { cache: "no-store" }
    )
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: any[] }) => {
        if (cancelled) return;
        setItems(
          (body.data ?? []).map((c) => ({
            id: c.id,
            title: c.name,
            subtitle: c.position,
            meta: c.email || undefined,
            badge: pill(
              c.status === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700",
              c.status ?? ""
            ),
            href: `/customers?record=${encodeURIComponent(c.id)}`,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, limit]);

  return (
    <SectionCard title="Customers" count={items.length} viewAllHref="/customers">
      {loading ? (
        <Loading />
      ) : (
        <RelatedList items={items} emptyMessage="No customers at this company." />
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Related Contacts (used on the Company workspace)                   */
/* ------------------------------------------------------------------ */

export function RelatedContactsList({
  companyId,
  limit = 5,
}: {
  companyId?: string;
  limit?: number;
}) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/contacts?filters=${encodeURIComponent(JSON.stringify({ companyId }))}&pageSize=${limit}`,
      { cache: "no-store" }
    )
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data: any[] }) => {
        if (cancelled) return;
        setItems(
          (body.data ?? []).map((c) => ({
            id: c.id,
            title: [c.firstName, c.lastName].filter(Boolean).join(" "),
            subtitle: c.position,
            meta: c.email || undefined,
            badge: pill(
              c.status === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700",
              c.status ?? ""
            ),
            href: `/contacts?record=${encodeURIComponent(c.id)}`,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, limit]);

  return (
    <SectionCard title="Contacts" count={items.length} viewAllHref="/contacts">
      {loading ? (
        <Loading />
      ) : (
        <RelatedList items={items} emptyMessage="No contacts at this company." />
      )}
    </SectionCard>
  );
}
