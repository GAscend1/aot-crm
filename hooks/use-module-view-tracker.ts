"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Maps URL path segments to module names for audit logging.
 * Only top-level module transitions are tracked — not every sub-route.
 */
function pathToModule(pathname: string): string | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return null;

  const moduleMap: Record<string, string> = {
    dashboard: "Dashboard",
    customers: "Customers",
    companies: "Companies",
    contacts: "Contacts",
    leads: "Leads",
    opportunities: "Opportunities",
    pipeline: "Opportunities",
    activities: "Activities",
    tickets: "Tickets",
    documents: "Documents",
    quotes: "Quotes",
    invoices: "Invoices",
    reports: "Reports",
    administration: "Administration",
    profile: "Profile",
    onboarding: "Onboarding",
    inbox: "Email",
    files: "Documents",
  };

  return moduleMap[segment] ?? null;
}

/**
 * Tracks module-level navigation and fires a MODULE_VIEW audit event
 * via POST /api/audit/module-view. Throttled server-side (60s per module
 * per user) and client-side (only fires on module transitions, not every
 * pathname change within the same module).
 */
export function useModuleViewTracker() {
  const pathname = usePathname();
  const lastModule = useRef<string | null>(null);

  useEffect(() => {
    const mod = pathToModule(pathname);
    if (!mod || mod === lastModule.current) return;
    lastModule.current = mod;

    // Fire-and-forget: never blocks navigation or shows errors to the user.
    fetch("/api/audit/module-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: mod, path: pathname }),
    }).catch(() => {
      // Non-critical — silently ignore failures.
    });
  }, [pathname]);
}
