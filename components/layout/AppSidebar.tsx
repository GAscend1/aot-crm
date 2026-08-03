"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import clsx from "clsx";
import { X, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={clsx(
          "flex w-full items-center rounded-md text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors",
          collapsed ? "justify-center p-2.5" : "gap-2 px-2 py-1",
          hasActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {collapsed ? (
          group.icon && <group.icon className="h-4 w-4" />
        ) : (
          <>
            {group.icon && <group.icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="flex-1 truncate text-left">{group.group}</span>
            <ChevronDown
              className={clsx(
                "h-3 w-3 shrink-0 transition-transform duration-150",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className={clsx("space-y-0.5", collapsed ? "mt-1" : "mt-0.5 pl-2")}>
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
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "relative flex items-center rounded-md text-sm font-medium transition-colors",
                      collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5",
                      active
                        ? "bg-primary-soft text-[color:var(--primary)]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {active && !collapsed && (
                      <span
                        className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--primary)]"
                        aria-hidden="true"
                      />
                    )}
                    <Icon className="shrink-0" size={16} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && (
                          <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--primary)]">
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
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();
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

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      localStorage.setItem("crm-sidebar-groups", JSON.stringify(next));
      return next;
    });
  }, []);

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b px-3.5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--primary)] text-xs font-bold text-primary-foreground">
            A
          </span>
          {!collapsed && (
            <h1 className="truncate text-sm font-bold tracking-tight text-foreground">
              AOT CRM
            </h1>
          )}
        </div>
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto px-2 py-2 scrollbar-thin"
        aria-label="Main navigation"
      >
        {navigation.map((group) => (
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

      <div className="hidden border-t px-2 py-2 lg:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="w-full justify-start"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <aside
        className={clsx(
          "fixed left-0 top-0 z-30 hidden h-full flex-col border-r bg-sidebar transition-all duration-200 lg:flex",
          collapsed ? "w-[60px]" : "w-[236px]"
        )}
      >
        {sidebarContent}
      </aside>

      <div
        className={clsx(
          "hidden transition-all duration-200 lg:block",
          collapsed ? "w-[60px]" : "w-[236px]"
        )}
      />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r bg-sidebar shadow-xl lg:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--primary)] text-xs font-bold text-primary-foreground">
                    A
                  </span>
                  <h1 className="text-sm font-bold tracking-tight text-foreground">
                    AOT CRM
                  </h1>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={closeMobile} aria-label="Close menu">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 scrollbar-thin" aria-label="Main navigation">
                {navigation.map((group) => (
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
