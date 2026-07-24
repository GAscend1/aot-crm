"use client";

import { ReactNode } from "react";
import clsx from "clsx";

import { useSidebar } from "@/components/layout/SidebarProvider";

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
            ? "lg:grid-cols-[72px_minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]"
        )}
      >
        {sidebar}

        <div className="flex min-w-0 flex-col">
          {navbar}

          <main className="flex-1 min-w-0 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}