"use client";

import { FeatureGate } from "@/components/subscription/FeatureGate";

/**
 * Tickets module gate — plans without tickets (Starter) see a clean locked
 * state instead of the module. The FeatureGate copy is plan-aware (computed
 * from lib/entitlements), and server routes independently enforce the same
 * entitlement (featureGate), so the UI can never widen access.
 */
export function TicketsModuleGate({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature="tickets" featureLabel="Tickets" mode="replace">
      {children}
    </FeatureGate>
  );
}
