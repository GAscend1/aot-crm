import { GraphClientError } from "./graph-client";

/**
 * Runtime integration states supported by the Microsoft 365 integration.
 *
 * The previous "pending administrator approval" pseudo-state was fake: it was
 * derived from configuration defaults rather than from the actual connection.
 * These states are computed from real runtime signals (config completeness,
 * signed-in session, token expiry, consent errors, and request failures).
 */
export type IntegrationState =
  | "CONNECTED"
  | "SIGN_IN_REQUIRED"
  | "RECONSENT_REQUIRED"
  | "TOKEN_EXPIRED"
  | "CONFIGURATION_ERROR"
  | "GRAPH_UNAVAILABLE"
  | "NOT_CONFIGURED";

export interface IntegrationStatus {
  /** Machine-readable state. */
  state: IntegrationState;
  /** USE_MICROSOFT_GRAPH === "true" */
  enabled: boolean;
  /** "live" when the feature is enabled, otherwise "mock". */
  provider: "live" | "mock";
  /** Short, user-safe summary. */
  title: string;
  /** User-safe detail. Never contains tokens or secrets. */
  message: string;
  detail?: string;
  /** Suggested user action, if any. */
  action?: "sign_in" | "reconsent" | "reconnect" | "configure" | "retry" | null;
  checkedAt: string;
}

export const INTEGRATION_STATE_META: Record<
  IntegrationState,
  { title: string; message: string; action: IntegrationStatus["action"] }
> = {
  CONNECTED: {
    title: "Connected",
    message: "Microsoft 365 is connected and syncing.",
    action: null,
  },
  SIGN_IN_REQUIRED: {
    title: "Sign in required",
    message: "Sign in with Microsoft Entra ID to connect Microsoft 365.",
    action: "sign_in",
  },
  RECONSENT_REQUIRED: {
    title: "Consent required",
    message:
      "Your Microsoft 365 connection needs consent again. Sign in to reconnect — CRM keeps working.",
    action: "reconsent",
  },
  TOKEN_EXPIRED: {
    title: "Session expired",
    message:
      "Your Microsoft 365 session expired and could not be refreshed. Sign in again to reconnect.",
    action: "reconnect",
  },
  CONFIGURATION_ERROR: {
    title: "Integration not configured",
    message:
      "Microsoft 365 credentials are not fully configured. Contact your administrator.",
    action: "configure",
  },
  GRAPH_UNAVAILABLE: {
    title: "Microsoft 365 unavailable",
    message:
      "Microsoft Graph is currently unavailable. The rest of the CRM keeps working normally.",
    action: "retry",
  },
  NOT_CONFIGURED: {
    title: "Not configured",
    message:
      "This integration is not configured. Contact your administrator — the rest of the CRM keeps working normally.",
    action: null,
  },
};

/**
 * Classify a Microsoft TEAMS-specific failure. Teams must never be reported as
 * a generic "Microsoft 365 unavailable" when the rest of Microsoft 365
 * (e.g. Outlook Calendar) is connected — the two share a session but have
 * independent permissions, licensing, and entitlement requirements.
 *
 * Returns an IntegrationStatus with a Teams-specific title so UIs can say
 * "Microsoft Teams unavailable" / "Unable to load/create Teams meetings."
 * instead of blaming the whole Microsoft 365 integration.
 */
export function classifyTeamsError(err: unknown): IntegrationStatus {
  const teams = (
    state: IntegrationState,
    message: string,
    action: IntegrationStatus["action"] = null,
  ): IntegrationStatus =>
    buildIntegrationStatus(state, {
      title: "Microsoft Teams unavailable",
      message,
      action,
      detail: err instanceof Error ? err.message : undefined,
    });

  if (err instanceof GraphClientError) {
    if (err.code === "no_token") {
      return teams(
        "SIGN_IN_REQUIRED",
        "Sign in with Microsoft Entra ID to use Teams meetings.",
        "sign_in",
      );
    }
    if (err.status === 401) {
      return teams(
        "TOKEN_EXPIRED",
        "Your Microsoft 365 session expired. Sign in again to use Teams meetings.",
        "reconnect",
      );
    }
    if (err.status === 403) {
      return teams(
        "RECONSENT_REQUIRED",
        "Teams meeting permissions need consent again. Reconnect to continue.",
        "reconsent",
      );
    }
    if (err.status === 503) {
      return teams(
        "GRAPH_UNAVAILABLE",
        "Unable to load/create Teams meetings.",
        "retry",
      );
    }
    return teams("GRAPH_UNAVAILABLE", "Unable to load/create Teams meetings.", "retry");
  }

  const message = err instanceof Error ? err.message : "";
  // Server-side entitlement rejection (withGraphAuth returns 403 with
  // FEATURE_NOT_ENTITLED) — the plan does not include Teams. Surface the exact
  // plan message instead of pretending Microsoft 365 is down.
  if (/not included in your current plan/i.test(message)) {
    return buildIntegrationStatus("NOT_CONFIGURED", {
      title: "Microsoft Teams unavailable",
      message,
      action: null,
    });
  }

  return teams("GRAPH_UNAVAILABLE", "Unable to load/create Teams meetings.", "retry");
}

/**
 * True when a thrown error represents an integration that is simply not
 * configured/enabled (e.g. Zoom's 503 "not enabled" response). UIs show the
 * graceful NOT CONFIGURED state instead of an error banner.
 */
export function isNotConfiguredError(err: unknown): boolean {
  if (err instanceof GraphClientError) return err.code === "graph_not_enabled";
  const message = err instanceof Error ? err.message : String(err);
  return /not enabled|not configured/i.test(message);
}

/** Feature flag — USE_MICROSOFT_GRAPH=true turns on the live provider. */
export function isGraphEnabled(): boolean {
  return process.env.USE_MICROSOFT_GRAPH === "true";
}

export interface IntegrationSignals {
  /** All AUTH_* + AUTH_SECRET env vars present. */
  configComplete: boolean;
  /** A signed-in session with a stored access token exists. */
  signedIn: boolean;
  /** Token exists but expiresAt is in the past (refresh failed). */
  tokenExpired?: boolean;
  /** Consent/authorization error recorded on the JWT. */
  authError?: string | null;
  /** Graph reachability failed on the last live probe (optional). */
  reachable?: boolean;
}

/**
 * Deterministically classify the integration state from runtime signals.
 * Pure function — safe to import in both server and client bundles.
 */
export function detectIntegrationState({
  configComplete,
  signedIn,
  tokenExpired,
  authError,
  reachable,
}: IntegrationSignals): IntegrationState {
  if (!configComplete) return "CONFIGURATION_ERROR";

  if (!signedIn) return "SIGN_IN_REQUIRED";

  if (authError) return "RECONSENT_REQUIRED";

  if (tokenExpired) return "TOKEN_EXPIRED";

  if (reachable === false) return "GRAPH_UNAVAILABLE";

  return "CONNECTED";
}

/** Build a user-safe IntegrationStatus payload. */
export function buildIntegrationStatus(
  state: IntegrationState,
  overrides?: Partial<Omit<IntegrationStatus, "state" | "checkedAt">>,
): IntegrationStatus {
  const meta = INTEGRATION_STATE_META[state];
  return {
    state,
    enabled: isGraphEnabled(),
    provider: isGraphEnabled() ? "live" : "mock",
    title: meta.title,
    message: meta.message,
    action: meta.action,
    checkedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Classify a failed client-side Graph request into a state + safe message.
 * Network failures and unknown errors map to GRAPH_UNAVAILABLE so UIs can
 * show a reconnect/retry affordance instead of crashing.
 */
export function classifyGraphError(err: unknown): IntegrationStatus {
  if (err instanceof GraphClientError) {
    if (err.code === "no_token") {
      return buildIntegrationStatus("SIGN_IN_REQUIRED", { detail: err.message });
    }
    if (err.status === 401) {
      return buildIntegrationStatus("TOKEN_EXPIRED", { detail: err.message });
    }
    if (err.status === 403) {
      return buildIntegrationStatus("RECONSENT_REQUIRED", { detail: err.message });
    }
    if (err.status === 503) {
      return buildIntegrationStatus("GRAPH_UNAVAILABLE", { detail: err.message });
    }
    return buildIntegrationStatus("GRAPH_UNAVAILABLE", { detail: err.message });
  }

  return buildIntegrationStatus("GRAPH_UNAVAILABLE", {
    detail: err instanceof Error ? err.message : "Unknown error",
  });
}

/**
 * Normalize any thrown value into a GraphClientError so downstream
 * classification works uniformly (including plain network failures).
 */
export function toGraphClientError(
  err: unknown,
  fallbackMessage: string,
): GraphClientError {
  if (err instanceof GraphClientError) return err;
  if (err instanceof Error) {
    return new GraphClientError(err.message, 0, "network_error");
  }
  return new GraphClientError(fallbackMessage, 0, "network_error");
}
