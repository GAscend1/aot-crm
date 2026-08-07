"use client";

import { FeatureGate } from "@/components/subscription/FeatureGate";

/**
 * Report Management module gate — Trial workspaces see a locked "Available on
 * Starter" state instead of the module. Server routes independently enforce
 * the same entitlement (featureGate), so the UI can never widen access.
 */
export function ReportsManageGate({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate feature="reports" featureLabel="Saved reports" mode="replace">
      {children}
    </FeatureGate>
  );
}
