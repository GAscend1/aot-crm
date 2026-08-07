"use client";

import { FeatureGate } from "@/components/subscription/FeatureGate";

/**
 * Invoices module gate — plans without invoices (Starter) see a locked
 * upgrade state instead of the module (Trial is full-feature and sees the
 * module). The locked copy is plan-aware via lib/entitlements, and server
 * routes independently enforce the same entitlement (featureGate), so the UI
 * can never widen access.
 */
export function InvoicesModuleGate({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature="invoices" featureLabel="Invoices" mode="replace">
      {children}
    </FeatureGate>
  );
}
