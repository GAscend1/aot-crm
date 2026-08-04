"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MoreHorizontal, LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RecordWorkspaceProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  badge?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Fully custom header. When provided it replaces the default header entirely. */
  header?: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  /**
   * Inline edit mode. When true, the body renders `editor` (the record form)
   * instead of `children`/`sidebar` so the SAME modal switches into edit mode
   * rather than stacking a second dialog on top.
   */
  editing?: boolean;
  /** Form rendered in the body while `editing` is true. */
  editor?: React.ReactNode;
  /** Header actions shown while `editing` is true (e.g. a Cancel button). */
  editingActions?: React.ReactNode;
  /** Keep the header mounted while editing so the title stays visible. */
  keepHeaderWhileEditing?: boolean;
  /**
   * "default" (current behavior) renders a single scrollable column.
   * "split" renders a true two-column shell (left workspace + right inspector)
   * with its own internal scrolling and overflow hidden at the shell level.
   */
  layout?: "default" | "split";
  /** Overrides the split shell size (width / height / radius). Defaults to ~82vw x 86vh capped at 1220px / 900px. */
  sizeClassName?: string;
  /** Extra classes merged onto the DialogContent shell. */
  contentClassName?: string;
  /** Extra classes merged onto the body container. */
  bodyClassName?: string;
}

/**
 * Large responsive record workspace shown over the current module list.
 * Full-screen on mobile, a two-column dialog on desktop.
 */
export function RecordWorkspace({
  open,
  onClose,
  title,
  eyebrow,
  badge,
  subtitle,
  actions,
  header,
  children,
  sidebar,
  footer,
  loading,
  editing = false,
  editor,
  editingActions,
  keepHeaderWhileEditing = false,
  layout = "default",
  sizeClassName,
  contentClassName,
  bodyClassName,
}: RecordWorkspaceProps) {
  const split = layout === "split";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className={cn(
          // Mobile: full-screen sheet. sm+: centered dialog.
          "top-0 left-0 grid h-dvh w-full max-w-none translate-x-0 translate-y-0 grid-cols-1 gap-0 rounded-none border-0 p-0",
          split
            ? cn(
                "grid-rows-[auto_minmax(0,1fr)] sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(86dvh,900px)] sm:w-[min(82vw,1220px)] sm:min-w-[min(960px,calc(100vw-1rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:grid-cols-1 sm:overflow-hidden sm:rounded-2xl sm:border sm:shadow-2xl",
                sizeClassName
              )
            : "sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[90dvh] sm:w-[calc(100%-1rem)] sm:max-w-[min(1320px,calc(100vw-1rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:grid-cols-[1fr_auto] sm:rounded-xl sm:border sm:shadow-2xl",
          contentClassName
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{subtitle}</DialogDescription>

        {loading ? (
          <RecordWorkspaceSkeleton />
        ) : (
          <>
            {header ?? (editing && !keepHeaderWhileEditing ? null : (
              <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-popover/95 px-5 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-popover/80">
                <div className="min-w-0">
                  {eyebrow && (
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {eyebrow}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      {title}
                    </h2>
                    {badge}
                  </div>
                  {subtitle && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
                </div>
                {editing
                  ? editingActions && (
                      <div className="flex shrink-0 items-center gap-2">{editingActions}</div>
                    )
                  : actions && (
                      <div className="flex shrink-0 items-center gap-2">{actions}</div>
                    )}
              </header>
            ))}

            <div
              className={cn(
                "min-h-0 min-w-0",
                split
                  ? "flex flex-col overflow-hidden lg:flex-row"
                  : "flex flex-col gap-5 overflow-y-auto px-5 py-5 lg:flex-row lg:gap-6",
                bodyClassName
              )}
            >
              {editing && editor ? (
                <div className="min-h-0 min-w-0 flex-1">{editor}</div>
              ) : (
                <>
                  <div
                    className={cn(
                      "min-h-0 min-w-0",
                      split ? "flex-1" : "flex-1 space-y-5"
                    )}
                  >
                    {children}
                  </div>
                  {sidebar && (
                    <aside
                      className={cn(
                        "shrink-0",
                        split ? "w-full lg:w-auto" : "w-full space-y-5 lg:w-72"
                      )}
                    >
                      {sidebar}
                    </aside>
                  )}
                </>
              )}
            </div>

            {footer && (
              <footer className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-popover/95 px-5 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-popover/80">
                {footer}
              </footer>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RecordWorkspaceSection({
  title,
  children,
  actions,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-surface-raised", className)}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function RecordWorkspaceField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-0.5 truncate text-sm text-foreground">
        {value ?? "—"}
      </div>
    </div>
  );
}

export function RecordWorkspaceGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface RecordQuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function RecordQuickActions({
  actions,
}: {
  actions: RecordQuickAction[];
}) {
  return (
    <RecordWorkspaceSection title="Quick Actions">
      <div className="flex flex-col gap-1.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                action.destructive
                  ? "border-danger/25 text-[color:var(--danger)] hover:bg-danger-soft"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {action.label}
            </button>
          );
        })}
      </div>
    </RecordWorkspaceSection>
  );
}

export interface RecordActionChip {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Soft tint color token, e.g. "--chart-1". Defaults to neutral. */
  tone?: string;
}

/**
 * Compact horizontal action toolbar (chips), used directly under a header.
 * Replaces oversized full-width Quick Actions panels.
 */
export function RecordActionBar({ actions }: { actions: RecordActionChip[] }) {
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-border bg-muted/30 px-3 py-1.5 sm:px-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ring-1 ring-inset transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
              action.destructive
                ? "bg-danger-soft text-[color:var(--danger)] ring-danger/25 hover:bg-[color:var(--danger)]/15"
                : action.tone
                  ? `bg-[color:var(${action.tone})]/[0.1] text-[color:var(${action.tone})] ring-[color:var(${action.tone})]/25 hover:bg-[color:var(${action.tone})]/[0.18]`
                  : "bg-muted text-foreground ring-border hover:bg-muted/70"
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden="true" />}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

export interface RecordMoreAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

/**
 * "More" overflow menu that hosts low-frequency and destructive actions
 * (e.g. archive/delete) instead of full-width danger buttons in the body.
 */
export function RecordMoreMenu({ actions }: { actions: RecordMoreAction[] }) {
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="More actions" />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={action.onClick}
            variant={action.destructive ? "destructive" : "default"}
          >
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RecordWorkspaceSkeleton() {
  return (
    <div className="space-y-4 p-5" role="status" aria-label="Loading record">
      <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <span className="sr-only">Loading record</span>
    </div>
  );
}

/**
 * Opens a record workspace from a `?record=<id>` query parameter so that
 * browser back / forward, deep links, and refresh all keep working while the
 * list (filters, pagination, scroll) stays mounted underneath.
 */
export function useRecordWorkspace<T extends { id: string }>(service: {
  findById: (id: string) => Promise<T | null>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const recordId = searchParams?.get("record") ?? null;
  const [record, setRecord] = useState<T | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loading = recordId !== null && recordId !== loadedId;

  useEffect(() => {
    if (!recordId) return;
    let cancelled = false;
    service
      .findById(recordId)
      .then((result) => {
        if (cancelled) return;
        setRecord(result);
        setLoadedId(recordId);
      })
      .catch(() => {
        if (!cancelled) {
          setRecord(null);
          setLoadedId(recordId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [recordId, service, refreshKey]);

  const open = useCallback(
    (id: string) => {
      // Preserve existing query params (e.g. ?view=kanban) when navigating
      // between sibling records, so prev/next never drops the active view.
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("record", id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const close = useCallback(() => {
    if (!recordId) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("record");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, recordId, searchParams]);

  const reload = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return { record, loading, recordId, open, close, reload, openParam: recordId !== null };
}

/**
 * Lightweight motion wrapper used for workspace content transitions.
 */
export function WorkspaceMotion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function useReducedMotionSafe() {
  const [reduce, setReduce] = React.useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);
  return reduce;
}
