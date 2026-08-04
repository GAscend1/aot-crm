"use client";

import "./globals.css";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Replaces the entire app shell when an unrecoverable
 * error escapes the root layout, so the user always sees a recoverable UI
 * instead of a blank page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-dvh items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-popover p-8 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
              <AlertTriangle className="h-6 w-6 text-[color:var(--danger)]" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A critical error occurred. Your data is safe — reload to
              continue.
              {error.digest && (
                <span className="mt-2 block font-mono text-xs text-muted-foreground/70">
                  Error ID: {error.digest}
                </span>
              )}
            </p>
            <Button className="mt-6" onClick={() => reset()}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reload
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
