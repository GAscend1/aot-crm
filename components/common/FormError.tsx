"use client";

import { AlertCircle } from "lucide-react";

/** Server-level error banner shown at the top of a form. */
export function FormErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-[color:var(--danger)]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

/** Field-level validation error rendered directly under an input. */
export function FormFieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-[color:var(--danger)]" role="alert">
      {message}
    </p>
  );
}
