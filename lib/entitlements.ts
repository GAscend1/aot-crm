/**
 * Central feature entitlements — the single source of truth for what each plan
 * may use. Mirrored by the `Entitlement`/`Plan` tables (seeded) so the Platform
 * Owner has an auditable record; this pure module is the fast path used by
 * both server routes and client components.
 *
 * Enforce here, never scatter plan checks across components.
 *
 * Product spec (v2 — final plan matrix):
 * - TRIAL is a FULL-FEATURE evaluation: every currently implemented module and
 *   integration feature is granted for the trial window (default 7 days).
 *   Entitlement does NOT bypass technical configuration — e.g. Trial + Zoom
 *   not configured → Zoom stays "Not configured".
 * - STARTER is the core CRM: companies, contacts/people, leads, opportunities
 *   (+ Kanban), tasks, activities, documents and standard reports. Quotes,
 *   Invoices, Tickets, Outlook Email, Calendar Sync, Teams, Zoom and advanced
 *   Microsoft 365 integrations are LOCKED.
 * - PROFESSIONAL adds the full sales toolkit: quotes, invoices, tickets,
 *   Outlook Email (Mail.Send — kept separate from Calendar Sync), advanced
 *   reports/analytics, automation and API where implemented. It does NOT
 *   include Calendar Sync, Teams or Zoom.
 * - ENTERPRISE unlocks everything implemented, including Outlook Calendar
 *   Sync, Microsoft Teams, Zoom (when configured), and all Microsoft 365 /
 *   advanced integrations and limits.
 *
 * Platform Owners are NOT in this matrix — the server-side feature gates add
 * an explicit Platform Owner bypass (lib/server/api.ts featureGate). Entitlement
 * here is "permission to use a feature"; technical configuration (is the
 * provider actually connected) is a separate runtime state, never faked.
 */

export const PLAN_CODES = ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const PLAN_LABELS: Record<PlanCode, string> = {
  TRIAL: "Trial",
  STARTER: "Starter",
  PROFESSIONAL: "Professional",
  ENTERPRISE: "Enterprise",
};

/** Feature codes — every feature the system can gate. */
export const ALL_FEATURES = [
  // Core CRM (all plans)
  "companies",
  "contacts",
  "leads",
  "opportunities",
  "kanban",
  "tasks",
  "activities",
  "documents",
  // Standard reporting (Starter+)
  "reports",
  // Sales toolkit (Professional+)
  "quotes",
  "invoices",
  "tickets",
  "outlook_email",
  "advanced_analytics",
  "automation",
  "api",
  "priority_support",
  // Microsoft 365 realtime + advanced (Enterprise)
  "calendar_sync",
  "teams",
  "zoom",
  "microsoft_365",
  "custom_integrations",
  "enterprise_configuration",
] as const;

/** Features every paid plan receives — the core CRM. */
const CORE_FEATURES: readonly string[] = [
  "companies",
  "contacts",
  "leads",
  "opportunities",
  "kanban",
  "tasks",
  "activities",
  "documents",
];

/** Starter = core CRM + standard reports. */
const STARTER_FEATURES: readonly string[] = [...CORE_FEATURES, "reports"];

/** Professional = Starter + the sales toolkit (no Calendar Sync / Teams / Zoom). */
const PROFESSIONAL_FEATURES: readonly string[] = [
  ...STARTER_FEATURES,
  "quotes",
  "invoices",
  "tickets",
  "outlook_email",
  "advanced_analytics",
  "automation",
  "api",
  "priority_support",
];

/** Enterprise = everything implemented. */
const ENTERPRISE_FEATURES: readonly string[] = [
  ...PROFESSIONAL_FEATURES,
  "calendar_sync",
  "teams",
  "zoom",
  "microsoft_365",
  "custom_integrations",
  "enterprise_configuration",
];

/**
 * Explicit per-plan feature sets (fail closed — unknown/empty plan codes grant
 * NOTHING). TRIAL grants every currently implemented feature because it is a
 * full-feature evaluation; the trial window and expiry policy are enforced
 * separately by the subscription status.
 */
const PLAN_FEATURES: Record<PlanCode, readonly string[]> = {
  TRIAL: ENTERPRISE_FEATURES,
  STARTER: STARTER_FEATURES,
  PROFESSIONAL: PROFESSIONAL_FEATURES,
  ENTERPRISE: ENTERPRISE_FEATURES,
};

/** Plan ordering (TRIAL first for iteration/display; paid ladder after it). */
export const PLAN_ORDER: PlanCode[] = ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

/** Paid-plan ladder used by featurePlan() for "upgrade to X" copy. */
export const PAID_PLAN_ORDER: PlanCode[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];

/**
 * All features a plan grants. Unknown/empty plan codes grant NOTHING (fail
 * closed) — a workspace with a missing or corrupt subscription must never
 * inherit trial entitlements.
 */
export function planFeatures(planCode: string): Set<string> {
  const set = PLAN_FEATURES[planCode as PlanCode];
  if (!set) return new Set<string>();
  return new Set(set);
}

/** Whether the plan grants the feature. */
export function canUseFeature(planCode: string | null | undefined, feature: string): boolean {
  if (!planCode) return false;
  return planFeatures(planCode).has(feature);
}

/** List of granted feature codes for display/audit. */
export function grantedFeatures(planCode: string | null | undefined): string[] {
  return [...planFeatures(planCode ?? "")].sort();
}

/**
 * The lowest PAID plan that grants a feature (e.g. "teams" → ENTERPRISE).
 * Used by locked-state UI copy: "Available on Starter", "Upgrade to
 * Professional". TRIAL is deliberately excluded — it is a temporary evaluation
 * state, not something to upgrade to. Returns null for unknown features.
 */
export function featurePlan(feature: string): PlanCode | null {
  for (const plan of PAID_PLAN_ORDER) {
    if (canUseFeature(plan, feature)) return plan;
  }
  return null;
}

/** Human label of the lowest paid plan granting the feature, or null. */
export function featurePlanLabel(feature: string): string | null {
  const plan = featurePlan(feature);
  return plan ? PLAN_LABELS[plan] : null;
}
