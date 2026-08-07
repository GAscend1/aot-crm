"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";

/**
 * Workspace plan indicator. Shows:
 * - TRIALING: "Trial · N days left" with a View Plans link.
 * - EXPIRED: read-only warning with upgrade/contact-sales prompt (data safe).
 * - SUSPENDED/CANCELED: read-only warning.
 * - Paid plans: a subtle plan chip (Starter/Professional/Enterprise).
 */
export function TrialBanner() {
  const { data, loading } = useSubscription();
  // Keyed on the plan/status so a plan change (e.g. owner upgrades the trial)
  // remounts the banner with dismissal reset — without setState-in-effect.
  const bannerKey = `${data?.planCode ?? ""}:${data?.status ?? ""}`;
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  if (loading || !data) return null;
  const dismissed = dismissedFor === bannerKey;

  // Verified AOT Platform Owners are NOT plan-restricted: show a full-access
  // badge instead of a trial countdown so the owner never appears to be on a
  // limited trial. (Display-only; server gates enforce the real bypass.)
  if (data.isPlatformOwner) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[color:var(--primary)]" aria-hidden />
          <p className="truncate text-foreground">
            <span className="font-medium">Platform Owner</span>
            <span className="text-muted-foreground"> · Full Access</span>
          </p>
        </div>
        <Link
          href="/administration"
          className="shrink-0 text-xs font-semibold text-[color:var(--primary)] hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Administration
        </Link>
      </div>
    );
  }

  const isTrial = data.trialActive;
  const expired = data.status === "EXPIRED";
  const suspended = data.status === "SUSPENDED" || data.status === "CANCELED";
  const paidActive = data.active && !isTrial;

  // Expired/suspended banners must never be dismissible — only the trial chip is.
  if (dismissed && isTrial) return null;

  if (expired) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 border-b border-danger/20 bg-danger-soft px-4 py-2"
      >
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[color:var(--danger)]" aria-hidden />
          <p className="truncate text-foreground">
            Your trial has ended. Your workspace is now <strong>read-only</strong> — your
            data is safe. Upgrade to keep editing.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/pricing"
            className="rounded-lg bg-[color:var(--danger)] px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Upgrade
          </Link>
          <Link
            href="/contact"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    );
  }

  if (suspended) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 border-b border-danger/20 bg-danger-soft px-4 py-2"
      >
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[color:var(--danger)]" aria-hidden />
          <p className="truncate text-foreground">
            This workspace is {data.status.toLowerCase()}. It is currently{" "}
            <strong>read-only</strong>. Contact your administrator to reactivate it.
          </p>
        </div>
      </div>
    );
  }

  if (isTrial) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-warning/20 bg-warning-soft px-4 py-1.5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Clock className="h-3.5 w-3.5 shrink-0 text-[color:var(--warning)]" aria-hidden />
          <p className="truncate text-foreground">
            <span className="font-medium">Trial</span>
            {data.trialDaysRemaining !== null && (
              <span className="text-muted-foreground">
                {" "}
                · {data.trialDaysRemaining} day{data.trialDaysRemaining === 1 ? "" : "s"} left
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/pricing"
            className="text-xs font-semibold text-[color:var(--primary)] hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            View Plans
          </Link>
          <button
            onClick={() => setDismissedFor(bannerKey)}
            aria-label="Dismiss trial banner"
            className="rounded p-0.5 text-muted-foreground hover:bg-warning/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (paidActive) {
    return (
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-1">
        <Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" aria-hidden />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{data.planLabel}</span> plan · full access
        </p>
      </div>
    );
  }

  return null;
}
