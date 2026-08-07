"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import { MobileTabBar } from "./MobileTabBar";
import { TrialBanner } from "@/components/subscription/TrialBanner";

interface AppShellProps {
  sidebar: ReactNode;
  navbar: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, navbar, children }: AppShellProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <div className="aot-app flex h-screen overflow-hidden bg-background text-foreground">
      {sidebar}

      <div className="flex min-w-0 flex-1 flex-col">
        <TrialBanner />
        {navbar}

        <main className="flex-1 overflow-y-auto scrollbar-thin pb-[calc(52px+env(safe-area-inset-bottom))] lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
