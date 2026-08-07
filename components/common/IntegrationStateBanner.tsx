"use client";

import { signIn, useSession } from "next-auth/react";
import { IntegrationWarning } from "./IntegrationWarning";
import type { IntegrationStatus } from "@/services/integration-gate";

interface IntegrationStateBannerProps {
  status: IntegrationStatus;
  /** Called for retry-style states (GRAPH_UNAVAILABLE). */
  onRetry?: () => void;
  /** Optional dismiss callback; hides the banner until next load. */
  onDismiss?: () => void;
}

/**
 * Renders the reconnect/retry UI for a real integration state. Replaces the
 * old hard-coded "awaiting administrator approval" banners with state-driven
 * messaging and actions (reconnect, retry, contact admin).
 */
export function IntegrationStateBanner({
  status,
  onRetry,
  onDismiss,
}: IntegrationStateBannerProps) {
  // The integration status page lives under the Platform-Owner-only
  // Administration module. Non-owners should never get a link to a page that
  // will redirect them — the message alone is the graceful provider state.
  const { data: session } = useSession();
  const isPlatformOwner = session?.user?.isPlatformOwner === true;

  switch (status.state) {
    case "CONNECTED":
      return null;

    case "SIGN_IN_REQUIRED":
    case "RECONSENT_REQUIRED":
    case "TOKEN_EXPIRED":
      return (
        <IntegrationWarning
          title={status.title}
          message={status.message}
          action={{
            label: "Reconnect",
            onClick: () => void signIn("microsoft-entra-id", { callbackUrl: window.location.pathname }),
          }}
          onDismiss={onDismiss}
        />
      );

    case "CONFIGURATION_ERROR":
      return (
        <IntegrationWarning
          title={status.title}
          message={status.message}
          action={
            isPlatformOwner
              ? {
                  label: "Integration status",
                  onClick: () => window.location.assign("/administration/microsoft-integration"),
                }
              : undefined
          }
          onDismiss={onDismiss}
        />
      );

    // A provider that is simply not configured (e.g. Teams not in the plan,
    // Zoom disabled) is a graceful state, not an error with a retry.
    case "NOT_CONFIGURED":
      return (
        <IntegrationWarning
          title={status.title}
          message={status.detail || status.message}
          onDismiss={onDismiss}
        />
      );

    case "GRAPH_UNAVAILABLE":
    default:
      return (
        <IntegrationWarning
          title={status.title}
          message={status.detail || status.message}
          action={
            onRetry && status.action !== null
              ? { label: "Retry", onClick: onRetry }
              : undefined
          }
          onDismiss={onDismiss}
        />
      );
  }
}
