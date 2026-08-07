"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { featurePlan, PLAN_LABELS } from "@/lib/entitlements";

interface FeatureGateProps {
  feature: string;
  /** Label of the feature for the upgrade prompt (e.g. "Outlook Email"). */
  featureLabel: string;
  /** Render mode. "replace" swaps the children for a locked card when blocked. */
  mode?: "replace" | "hide" | "disabled";
  children: React.ReactNode;
}

/**
 * Single source of truth for UI feature gating — components never check plan
 * codes themselves. Server routes independently re-check entitlements via
 * canUseFeature(), so the UI can never widen access.
 *
 * - replace: children replaced by a small "upgrade to unlock" card.
 * - hide: children hidden entirely when the feature is blocked.
 * - disabled: children rendered but dimmed with a lock badge.
 *
 * Locked states are plan-aware: the copy names the lowest plan that unlocks
 * the feature (e.g. "Available on Professional"), computed from lib/entitlements.
 */
export function FeatureGate({ feature, featureLabel, mode = "replace", children }: FeatureGateProps) {
  const { data, loading } = useSubscription();

  // While the subscription is loading, hide content to avoid flashing gated
  // features to plans that don't include them.
  if (loading || !data) return null;

  const granted = data.canUse?.[feature] === true;

  if (granted) return <>{children}</>;

  const requiredPlan = featurePlan(feature);
  const planName = requiredPlan ? PLAN_LABELS[requiredPlan] : null;

  if (mode === "hide") return null;

  if (mode === "disabled") {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-40" aria-hidden>
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Lock className="h-3.5 w-3.5 text-[color:var(--warning)]" aria-hidden />
            {featureLabel} — {planName ? `available on ${planName}` : "upgrade to unlock"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning-soft">
        <Lock className="h-5 w-5 text-[color:var(--warning)]" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {featureLabel} is not included in {data.planLabel}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {planName ? (
            <>
              <span className="font-medium text-foreground">Available on {planName}.</span>{" "}
              Upgrade to unlock {featureLabel.toLowerCase()} — no card required to get started.
            </>
          ) : (
            <>Upgrade your plan to unlock this feature.</>
          )}
        </p>
      </div>
      <Link
        href="/pricing"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[color:var(--primary)] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        {planName ? `View ${planName} Plans` : "View Plans"}
      </Link>
    </div>
  );
}

/** Convenience: true when the signed-in plan grants the feature. */
export function useFeatureGranted(feature: string): boolean | null {
  const { data, loading } = useSubscription();
  if (loading || !data) return null;
  return data.canUse?.[feature] === true;
}
