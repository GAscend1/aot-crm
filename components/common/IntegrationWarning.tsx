"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationWarningProps {
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
  className?: string;
}

/**
 * Non-blocking banner shown when an integration (e.g. Microsoft Graph) is
 * degraded or disconnected. CRM functionality stays operational.
 */
export function IntegrationWarning({
  title = "Integration needs attention",
  message = "Your Microsoft 365 connection needs attention. CRM data continues to work normally.",
  action,
  onDismiss,
  className,
}: IntegrationWarningProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft/60 px-4 py-3",
        className
      )}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warning)]"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 rounded-md border border-warning/30 px-2.5 py-1 text-xs font-medium text-[color:var(--warning)] transition-colors hover:bg-warning-soft focus-visible:ring-2 focus-visible:ring-ring"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss warning"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
