"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Route-segment error boundary. Catches render errors for the pages nested
 * under this segment and offers a one-click retry without a full reload.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-popover p-8 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="h-6 w-6 text-[color:var(--danger)]" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred while loading this page. Please try
          again.
          {error.digest && (
            <span className="mt-2 block font-mono text-xs text-muted-foreground/70">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <Button className="mt-6" onClick={() => reset()}>
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
