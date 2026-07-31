"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import clsx from "clsx";
import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { navigation } from "@/config/navigation";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { Button } from "@/components/ui/button";

function NavGroup({
  group,
  collapsed,
  isOpen,
  onToggle,
  pathname,
  onNavigate,
}: {
  group: (typeof navigation)[number];
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  onNavigate: () => void;
}) {
  const hasActive = group.items.some(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(item.href + "/")
  );

  return (
    <div>
      <button
        onClick={onToggle}
        className={clsx(
          "flex w-full items-center rounded-md text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
          collapsed ? "justify-center p-2.5" : "gap-2 px-2.5 py-1.5",
          hasActive
            ? "text-slate-800 dark:text-white"
            : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        )}
      >
        {collapsed ? (
          group.icon && <group.icon className="h-4 w-4" />
        ) : (
          <>
            {group.icon && <group.icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="flex-1 text-left truncate">{group.group}</span>
            <ChevronDown
              className={clsx(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className={clsx("space-y-px", collapsed ? "mt-1" : "mt-0.5 pl-3")}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.title : undefined}
                    className={clsx(
                      "flex items-center rounded-md text-sm font-medium transition-colors",
                      collapsed
                        ? "justify-center p-2.5"
                        : "gap-2.5 px-2.5 py-1.5",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                    )}
                  >
                    <Icon className={clsx("shrink-0", collapsed ? "h-4 w-4" : "h-4 w-4")} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && (
                          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("crm-sidebar-groups") ?? "{}");
      } catch {
        return {};
      }
    }
    return {};
  });

  const visibleGroups = navigation;

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      localStorage.setItem("crm-sidebar-groups", JSON.stringify(next));
      return next;
    });
  }, []);

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b px-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
            A
          </span>
          {!collapsed && (
            <h1 className="text-sm font-bold tracking-tight text-slate-900 truncate dark:text-white">
              AOT CRM
            </h1>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
        {visibleGroups.map((group) => (
          <NavGroup
            key={group.group}
            group={group}
            collapsed={collapsed}
            isOpen={expandedGroups[group.group] ?? true}
            onToggle={() => toggleGroup(group.group)}
            pathname={pathname}
            onNavigate={closeMobile}
          />
        ))}
      </nav>
    </>
  );

  return (
    <>
      <aside
        className={clsx(
          "fixed left-0 top-0 z-30 hidden h-full flex-col border-r bg-white transition-all duration-300 lg:flex dark:bg-slate-950 dark:border-slate-800",
          collapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      <div
        className={clsx(
          "hidden transition-all duration-300 lg:block",
          collapsed ? "w-[60px]" : "w-[240px]"
        )}
      />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r bg-white shadow-xl lg:hidden dark:bg-slate-950 dark:border-slate-800"
            >
              <div className="flex h-14 items-center justify-between border-b px-4 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                    A
                  </span>
                  <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    AOT CRM
                  </h1>
                </div>
                <Button variant="ghost" size="icon" onClick={closeMobile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {visibleGroups.map((group) => (
                  <NavGroup
                    key={group.group}
                    group={group}
                    collapsed={false}
                    isOpen={expandedGroups[group.group] ?? true}
                    onToggle={() => toggleGroup(group.group)}
                    pathname={pathname}
                    onNavigate={closeMobile}
                  />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
