import { describe, it, expect } from "vitest";
import {
  PLAN_CODES,
  PLAN_ORDER,
  planFeatures,
  canUseFeature,
  grantedFeatures,
  featurePlan,
  featurePlanLabel,
  ALL_FEATURES,
} from "@/lib/entitlements";

/**
 * Final plan matrix (product spec v2):
 *
 * TRIAL = FULL-FEATURE evaluation (7 days). Every currently implemented module
 *   and integration feature is granted. Entitlement never bypasses technical
 *   configuration (e.g. Zoom stays "Not configured" until the provider is
 *   connected).
 * STARTER = core CRM + standard reports. Quotes/Invoices/Tickets/Outlook
 *   Email/Calendar Sync/Teams/Zoom/advanced M365 are LOCKED.
 * PROFESSIONAL = Starter + quotes/invoices/tickets/Outlook Email (Mail.Send is
 *   separate from Calendar Sync)/advanced analytics/automation/API. NOT
 *   Calendar Sync, Teams or Zoom.
 * ENTERPRISE = everything implemented (Calendar Sync, Teams, Zoom, all M365).
 *
 * Enforced server-side (featureGate + Platform Owner bypass) and in the UI
 * (FeatureGate / useCanUse).
 */
describe("entitlements plan matrix (final)", () => {
  const CORE = [
    "companies",
    "contacts",
    "leads",
    "opportunities",
    "kanban",
    "tasks",
    "activities",
    "documents",
  ];

  it("TRIAL grants EVERY implemented feature (full-feature evaluation)", () => {
    const features = planFeatures("TRIAL");
    for (const feature of ALL_FEATURES) {
      expect(features.has(feature), `TRIAL should grant ${feature}`).toBe(true);
    }
  });

  it("STARTER grants the core CRM + reports, but NOT the sales toolkit", () => {
    const features = planFeatures("STARTER");
    for (const feature of [...CORE, "reports"]) {
      expect(features.has(feature), `STARTER should grant ${feature}`).toBe(true);
    }
    for (const feature of [
      "quotes",
      "invoices",
      "tickets",
      "outlook_email",
      "calendar_sync",
      "teams",
      "zoom",
      "microsoft_365",
      "advanced_analytics",
      "automation",
      "api",
    ]) {
      expect(features.has(feature), `STARTER must NOT grant ${feature}`).toBe(false);
    }
  });

  it("PROFESSIONAL adds quotes/invoices/tickets/email/advanced, but NOT Calendar Sync/Teams/Zoom", () => {
    const features = planFeatures("PROFESSIONAL");
    for (const feature of [
      ...CORE,
      "reports",
      "quotes",
      "invoices",
      "tickets",
      "outlook_email",
      "advanced_analytics",
      "automation",
      "api",
    ]) {
      expect(features.has(feature), `PROFESSIONAL should grant ${feature}`).toBe(true);
    }
    for (const feature of ["calendar_sync", "teams", "zoom", "microsoft_365", "custom_integrations"]) {
      expect(features.has(feature), `PROFESSIONAL must NOT grant ${feature}`).toBe(false);
    }
  });

  it("ENTERPRISE grants every feature including Calendar Sync, Teams and Zoom", () => {
    const features = planFeatures("ENTERPRISE");
    for (const feature of ALL_FEATURES) {
      expect(features.has(feature), `ENTERPRISE should grant ${feature}`).toBe(true);
    }
  });

  it("canUseFeature returns false for null/undefined/unknown plans and unknown features", () => {
    expect(canUseFeature(null, "quotes")).toBe(false);
    expect(canUseFeature(undefined, "quotes")).toBe(false);
    expect(canUseFeature("", "quotes")).toBe(false);
    expect(canUseFeature("NOPE", "quotes")).toBe(false);
    expect(canUseFeature("TRIAL", "does_not_exist")).toBe(false);
    expect(canUseFeature("TRIAL", "kanban")).toBe(true);
    expect(canUseFeature("TRIAL", "teams")).toBe(true); // full-feature trial
  });

  it("grantedFeatures sorts and honors the plan", () => {
    expect(grantedFeatures("STARTER")).toEqual(
      [
        "activities",
        "companies",
        "contacts",
        "documents",
        "kanban",
        "leads",
        "opportunities",
        "reports",
        "tasks",
      ].sort(),
    );
    expect(grantedFeatures(null)).toEqual([]);
  });

  it("featurePlan maps gated features to the lowest PAID plan (TRIAL excluded from upgrade copy)", () => {
    expect(featurePlan("companies")).toBe("STARTER");
    expect(featurePlan("reports")).toBe("STARTER");
    expect(featurePlan("quotes")).toBe("PROFESSIONAL");
    expect(featurePlan("invoices")).toBe("PROFESSIONAL");
    expect(featurePlan("tickets")).toBe("PROFESSIONAL");
    expect(featurePlan("outlook_email")).toBe("PROFESSIONAL");
    expect(featurePlan("advanced_analytics")).toBe("PROFESSIONAL");
    expect(featurePlan("calendar_sync")).toBe("ENTERPRISE");
    expect(featurePlan("teams")).toBe("ENTERPRISE");
    expect(featurePlan("zoom")).toBe("ENTERPRISE");
    expect(featurePlan("microsoft_365")).toBe("ENTERPRISE");
    expect(featurePlan("custom_integrations")).toBe("ENTERPRISE");
    expect(featurePlan("nope")).toBeNull();
  });

  it("featurePlanLabel returns human plan names for locked-state UI copy", () => {
    expect(featurePlanLabel("quotes")).toBe("Professional");
    expect(featurePlanLabel("teams")).toBe("Enterprise");
    expect(featurePlanLabel("reports")).toBe("Starter");
    expect(featurePlanLabel("unknown_feature")).toBeNull();
  });

  it("PLAN_CODES covers every plan with a label and ALL_FEATURES is complete", () => {
    expect(PLAN_CODES).toEqual(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]);
    expect(PLAN_ORDER).toEqual(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]);
    expect(ALL_FEATURES).toContain("documents");
    expect(ALL_FEATURES).toContain("teams");
    expect(ALL_FEATURES).toContain("zoom");
    expect(ALL_FEATURES).toContain("calendar_sync");
  });
});
