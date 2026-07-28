"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      {sidebar}

      <div className="flex min-w-0 flex-1 flex-col">
        {navbar}

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
