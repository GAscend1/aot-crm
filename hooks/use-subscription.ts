"use client";

import { useEffect, useState } from "react";

export interface SubscriptionStatus {
  /** Display-only Platform Owner flag (server computes it from the verified tid). */
  isPlatformOwner?: boolean;
  organizationId: string;
  organizationName: string;
  microsoftTenantId: string | null;
  createdAt: string | null;
  planCode: string;
  planLabel: string;
  status: string;
  source: string;
  trialActive: boolean;
  active: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  features: string[];
  canUse: Record<string, boolean>;
  plans: string[];
}

interface LoadState {
  data: SubscriptionStatus | null;
  loading: boolean;
  error: boolean;
}

/**
 * Client-side subscription/entitlement source. Loaded once on mount; server
 * routes independently re-check entitlements via getSubscription() so the UI
 * can never widen access.
 */
export function useSubscription(): LoadState {
  const [state, setState] = useState<LoadState>({ data: null, loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/subscription")
      .then(async (res) => {
        if (!res.ok) throw new Error("Request failed");
        const body = await res.json();
        if (!cancelled) setState({ data: body.data, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Convenience check for a single feature. */
export function useCanUse(feature: string): boolean {
  const { data } = useSubscription();
  return data?.canUse?.[feature] ?? false;
}
