"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/components/enterprise/ThemeProvider";
import { QueryCacheBridge } from "@/components/enterprise/QueryCacheBridge";

export default function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient is created once per mount (never shared across sessions on the
  // server), with conservative defaults tuned for a CRM: 30s freshness, no
  // focus refetch storm, single retry.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* QueryCacheBridge MUST always render inside QueryClientProvider — it
          subscribes to entity mutation events and invalidates the shared
          api-list / dashboard / reports caches. Placing it here, as a direct
          child of the provider, makes that invariant structural instead of
          depending on which layout mounts the app shell. It therefore also
          mounts on public/marketing pages — harmless there (no entity
          mutations fire on public routes, so invalidations are no-ops). */}
      <QueryCacheBridge />
      <SessionProvider>
        {/* Respect the OS-level “reduce motion” preference for framer-motion
            animations (Timeline, SavedViews, ProductTour, etc.). */}
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </MotionConfig>
      </SessionProvider>
    </QueryClientProvider>
  );
}
