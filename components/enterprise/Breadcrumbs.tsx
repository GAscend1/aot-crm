"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  // Legacy module: full-page customer records show under the canonical
  // People/Contacts label (Phase 2 consolidation).
  customers: "People",
  companies: "Companies",
  contacts: "People",
  leads: "Leads",
  opportunities: "Opportunities",
  activities: "Activities",
  tickets: "Tickets",
  documents: "Documents",
  reports: "Reports",
  administration: "Administration",
  quotes: "Quotes",
  invoices: "Invoices",
  kanban: "Pipeline",
  calendar: "Calendar",
  email: "Email",
  meetings: "Meetings",
  files: "Files",
  profile: "Profile",
};

/** Maps active view params to breadcrumb labels (e.g. ?view=customers → Customers). */
const viewLabelMap: Record<string, string> = {
  people: "People",
  customers: "Customers",
  leads: "Leads",
  list: "List",
  kanban: "Pipeline",
  forecast: "Forecast",
  timeline: "Timeline",
  tasks: "Tasks",
  calendar: "Calendar",
  meetings: "Meetings",
  email: "Email",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Record routes whose last path segment is a UUID. The crumb for that segment
 * is replaced with the record's human-readable name (fetched org-scoped from
 * the existing record API) so breadcrumbs never expose a raw UUID as the
 * primary label (e.g. Home > People > Jane Doe).
 */
const RECORD_ENTITIES: Record<
  string,
  { pick: (d: Record<string, unknown>) => string }
> = {
  contacts: {
    pick: (d) => `${String(d.firstName ?? "")} ${String(d.lastName ?? "")}`.trim(),
  },
  customers: { pick: (d) => String(d.name ?? "") },
  leads: { pick: (d) => String(d.title ?? "") },
  companies: {
    pick: (d) => String(d.companyName ?? d.name ?? ""),
  },
  opportunities: { pick: (d) => String(d.title ?? "") },
  quotes: { pick: (d) => String(d.quoteNumber ?? "") },
  invoices: { pick: (d) => String(d.invoiceNumber ?? "") },
  tickets: { pick: (d) => String(d.subject ?? d.title ?? "") },
  activities: { pick: (d) => String(d.subject ?? "") },
};

/** Module-level cache so navigating between records never refetches a name. */
const recordNameCache = new Map<string, string>();

/**
 * Resolves the human-readable label for a record detail path (or null).
 *
 * All state is only set from async fetch callbacks (never synchronously in the
 * effect body) so `react-hooks/set-state-in-effect` stays satisfied. A failed
 * fetch falls back to the raw segment label instead of blocking the page.
 */
function useRecordName(pathname: string): {
  name: string | null;
  pending: boolean;
} {
  const parts = pathname.split("/").filter(Boolean);
  const entity = parts[0];
  const id = parts[parts.length - 1];
  const config = entity ? RECORD_ENTITIES[entity] : undefined;
  const isRecordPath = !!config && !!id && UUID_RE.test(id);
  const cacheKey = isRecordPath ? `${entity}:${id}` : null;
  const cached = cacheKey ? recordNameCache.get(cacheKey) : undefined;

  // Loaded name is only used when it belongs to the current record path, so
  // switching pages never shows a stale name.
  const [loaded, setLoaded] = useState<{ key: string; name: string } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  const name = isRecordPath
    ? (cached ?? (loaded?.key === cacheKey ? loaded.name : null))
    : null;

  useEffect(() => {
    if (!isRecordPath || !cacheKey || cached) return;
    let cancelled = false;

    fetch(`/api/${entity}/${id}`, { cache: "no-store" })
      .then((res) =>
        res.ok ? (res.json() as Promise<Record<string, unknown>>) : null
      )
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          // Non-OK response (e.g. archived record, 403, 404) — fall back to
          // the raw segment label instead of showing "…" forever.
          setFailedKey(cacheKey);
          return;
        }
        const label = config.pick(data).trim();
        if (label) {
          recordNameCache.set(cacheKey, label);
          setLoaded({ key: cacheKey, name: label });
        } else {
          // Empty extracted label — same fallback.
          setFailedKey(cacheKey);
        }
      })
      .catch(() => {
        // Leave the raw label as the fallback; never block the page.
        setFailedKey(cacheKey);
      });

    return () => {
      cancelled = true;
    };
  }, [isRecordPath, cacheKey, cached, entity, id, config]);

  const pending = isRecordPath && !name && failedKey !== cacheKey;
  return { name, pending };
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams?.get("view");
  const { name: recordName, pending } = useRecordName(pathname);

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [{ label: "Home", href: "/dashboard" }];

    let current = "";
    for (const part of parts) {
      if (part === "(app)") continue;
      current += `/${part}`;
      const label = labelMap[part] || part.charAt(0).toUpperCase() + part.slice(1);
      crumbs.push({ label, href: current });
    }

    // Surface the active module view as a sub-crumb (e.g. People → Customers).
    if (view && viewLabelMap[view]) {
      crumbs.push({ label: viewLabelMap[view], href: `${pathname}?view=${view}` });
    }

    return crumbs;
  }, [pathname, view]);

  // Replace the last crumb's raw UUID label with the record's name when the
  // record loaded; while it is fetching show a neutral ellipsis instead of the
  // raw id so a UUID is never the primary breadcrumb label.
  const last = crumbs[crumbs.length - 1];
  const isRecordPath = (() => {
    const parts = pathname.split("/").filter(Boolean);
    const entity = parts[0];
    const id = parts[parts.length - 1];
    return !!entity && !!RECORD_ENTITIES[entity] && !!id && UUID_RE.test(id);
  })();

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.slice(0, -1).map((segment) => (
        <span key={segment.href} className="flex items-center gap-1.5">
          <Link
            href={segment.href}
            className="rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {segment.label}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      ))}
      <span
        aria-current="page"
        className="max-w-[220px] truncate font-medium text-foreground"
        title={isRecordPath && recordName ? recordName : last.label}
      >
        {isRecordPath && pending
          ? "…"
          : isRecordPath && recordName
            ? recordName
            : last.label}
      </span>
    </nav>
  );
}
