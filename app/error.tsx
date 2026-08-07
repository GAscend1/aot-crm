"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A stale client chunk reference (dev-server restart, redeploy, long-lived
 * tab) fails with ChunkLoadError and would otherwise leave a dead error page.
 * Detect it and reload once so the browser fetches the current module graph —
 * this is what makes the Documents module (and every other page) self-heal
 * after a dev-server restart instead of showing "Something went wrong".
 */
function isChunkLoadError(error: Error & { digest?: string }): boolean {
  return (
    error?.name === "ChunkLoadError" ||
    /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module/i.test(
      error?.message ?? ""
    )
  );
}

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
  const chunkError = isChunkLoadError(error);

  // Auto-recover stale chunk references with a SINGLE reload per page load
  // (sessionStorage guard prevents an infinite reload loop if the manifest
  // stays broken).
  useEffect(() => {
    if (!chunkError) return;
    if (window.sessionStorage.getItem("aot-chunk-reload") === "1") return;
    window.sessionStorage.setItem("aot-chunk-reload", "1");
    const timer = window.setTimeout(() => window.location.reload(), 350);
    return () => window.clearTimeout(timer);
  }, [chunkError]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-popover p-8 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="h-6 w-6 text-[color:var(--danger)]" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">
          {chunkError ? "Refreshing…" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {chunkError
            ? "A newer version of the app was loaded. Refreshing automatically — one moment."
            : "An unexpected error occurred while loading this page. Please try again."}
          {error.digest && (
            <span className="mt-2 block font-mono text-xs text-muted-foreground/70">
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <Button
          className="mt-6"
          onClick={() =>
            chunkError ? window.location.reload() : reset()
          }
        >
          {chunkError ? (
            <>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Reload now
            </>
          ) : (
            <>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Try again
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
