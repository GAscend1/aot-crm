"use client";

import { ReactNode } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import clsx from "clsx";

interface AppShellProps {
  sidebar: ReactNode;
  navbar: ReactNode;
  children: ReactNode;
}

export function AppShell({
  sidebar,
  navbar,
  children,
}: AppShellProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-100">
      <div
        className={clsx(
          "grid min-h-screen transition-all duration-300",
          collapsed
            ? "lg:grid-cols-[72px_1fr]"
            : "lg:grid-cols-[260px_1fr]"
        )}
      >
        {sidebar}

        <div className="flex flex-col overflow-hidden">
          {navbar}

          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}