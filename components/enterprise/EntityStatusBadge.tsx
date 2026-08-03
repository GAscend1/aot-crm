"use client";

import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple";

interface EntityStatusBadgeProps {
  label: string;
  tone?: StatusTone;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const toneStyles: Record<StatusTone, string> = {
  success:
    "bg-success-soft text-[color:var(--success)] ring-success/25",
  warning:
    "bg-warning-soft text-[color:var(--warning)] ring-warning/25",
  danger:
    "bg-danger-soft text-[color:var(--danger)] ring-danger/25",
  info:
    "bg-info-soft text-[color:var(--info)] ring-info/25",
  neutral:
    "bg-muted text-muted-foreground ring-border",
  purple:
    "bg-purple-100 text-purple-700 ring-purple-600/20 dark:bg-purple-950/60 dark:text-purple-300",
};

const dotStyles: Record<StatusTone, string> = {
  success: "bg-[color:var(--success)]",
  warning: "bg-[color:var(--warning)]",
  danger: "bg-[color:var(--danger)]",
  info: "bg-[color:var(--info)]",
  neutral: "bg-muted-foreground/60",
  purple: "bg-purple-500",
};

/**
 * Maps a free-form status/stage value to a semantic tone.
 * Falls back to neutral for unknown values so the UI never crashes
 * on unexpected data.
 */
export function statusToneFor(value?: string | null): StatusTone {
  const v = (value ?? "").toLowerCase();
  if (
    /won|accepted|paid|completed|done|active|approved|converted|success/.test(v)
  ) {
    return "success";
  }
  if (
    /lost|failed|rejected|overdue|blocked|cancelled|canceled|archived/.test(v)
  ) {
    return "danger";
  }
  if (
    /draft|new|planned|pending|in progress|sent|open|prospect|proposal/.test(v)
  ) {
    return "warning";
  }
  if (
    /contacted|qualified|negotiation|discovery|engaged/.test(v)
  ) {
    return "info";
  }
  return "neutral";
}

export function EntityStatusBadge({
  label,
  tone,
  dot = true,
  size = "sm",
  className,
}: EntityStatusBadgeProps) {
  const resolved = tone ?? statusToneFor(label);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneStyles[resolved],
        size === "md" && "px-2.5 py-1 text-[0.8rem]",
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[resolved])} aria-hidden="true" />}
      {label}
    </span>
  );
}
