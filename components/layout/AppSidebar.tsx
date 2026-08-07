"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import clsx from "clsx";
import { X, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { navigationForUser, findActiveItemHref, type NavigationGroup } from "@/config/navigation";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { Button } from "@/components/ui/button";

/**
 * Persisted sidebar group expansion.
 *
 * Implemented as a tiny external store read through useSyncExternalStore so
 * that: (1) SSR and the first client render both produce the DEFAULT state
 * (no hydration mismatch — the earlier aria-expanded failure came from reading
 * localStorage inside the useState initializer); (2) the persisted expansion
 * is applied on the client after hydration via the store's server snapshot
 * fallback; (3) no setState-in-effect lint violation.
 *
 * Snapshot stability: React requires BOTH the server snapshot and the client
 * snapshot to be referentially stable whenever the underlying state has not
 * changed (a fresh object literal per call triggers the "getServerSnapshot
 * should be cached" infinite-loop warning). EMPTY_GROUPS is a single frozen
 * constant shared by the server snapshot and the pre-hydration client state.
 */
const GROUPS_KEY = "crm-sidebar-groups";
const EMPTY_GROUPS: Record<string, boolean> = {};
let groupsCache: Record<string, boolean> = EMPTY_GROUPS;
let groupsHydrated = false;
const groupListeners = new Set<() => void>();

function readGroupsSnapshot(): Record<string, boolean> {
  return groupsCache;
}

function subscribeGroups(listener: () => void): () => void {
  groupListeners.add(listener);
  return () => {
    groupListeners.delete(listener);
  };
}

/**
 * Server/initial snapshot — always the deterministic default, and referentially
 * stable (same constant every call). This is what makes SSR and the first
 * client hydration render produce identical markup and avoids the React
 * "cached snapshot" warning.
 */
function getServerGroups(): Record<string, boolean> {
  return EMPTY_GROUPS;
}

function hydrateGroups() {
  if (groupsHydrated) return;
  groupsHydrated = true;
  try {
    const saved = localStorage.getItem(GROUPS_KEY);
    groupsCache = saved ? (JSON.parse(saved) as Record<string, boolean>) : EMPTY_GROUPS;
  } catch {
    groupsCache = EMPTY_GROUPS;
  }
  groupListeners.forEach((listener) => listener());
}

function updateGroups(
  updater: (prev: Record<string, boolean>) => Record<string, boolean>,
) {
  groupsCache = updater(groupsCache);
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groupsCache));
  } catch {
    /* storage unavailable — in-memory only */
  }
  groupListeners.forEach((listener) => listener());
}

function NavGroup({
  group,
  collapsed,
  isOpen,
  onToggle,
  activeHref,
  onNavigate,
}: {
  group: NavigationGroup;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  activeHref: string | null;
  onNavigate: () => void;
}) {
  // Hidden items (merged legacy modules like Customers/Leads/Files/Inbox)
  // stay in config for deep links and the command palette but are NEVER
  // surfaced in the sidebar. CanonicalModulePath normalization in
  // findActiveItemHref means a legacy full-page record (/customers/<uuid>)
  // highlights its canonical module (Contacts) instead of a redundant item.
  const visibleItems = group.items.filter((item) => !item.hidden);
  if (visibleItems.length === 0) return null;

  const hasActive = visibleItems.some((item) => item.href === activeHref);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={clsx(
          "flex w-full items-center rounded-md text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors duration-150",
          collapsed ? "justify-center p-2" : "gap-2 px-2 py-1",
          hasActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {collapsed ? (
          group.icon && <group.icon className="h-4 w-4" />
        ) : (
          <>
            {group.icon && <group.icon className="h-3 w-3 shrink-0" />}
            <span className="flex-1 truncate text-left">{group.group}</span>
            <ChevronDown
              className={clsx(
                "h-2.5 w-2.5 shrink-0 transition-transform duration-150",
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
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === activeHref;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.title : undefined}
                    aria-current={active ? "page" : undefined}
                    data-tour={`nav-${item.href}`}
                    className={clsx(
                      "relative flex items-center rounded-md text-sm font-medium transition-colors duration-150",
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
                          <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] font-semibold text-[color:var(--primary)]">
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

export function AppSidebar({ isPlatformOwner = false }: { isPlatformOwner?: boolean }) {
  const pathname = usePathname();
  const activeHref = findActiveItemHref(pathname);
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();

  // Expanded groups come from an external store (useSyncExternalStore): the
  // server and first client render both use the deterministic default, and the
  // persisted localStorage value is applied on the client after hydration via a
  // store notification (no setState-in-effect). Owner-only items
  // (Administration) are filtered OUT of every discovery surface for non-
  // Platform Owners — the entry simply does not exist.
  const expandedGroups = useSyncExternalStore(
    subscribeGroups,
    readGroupsSnapshot,
    getServerGroups,
  );
  // Hydrate the persisted expansion on the client after mount. The store
  // notifies useSyncExternalStore, which re-renders with the persisted value —
  // the server HTML is always the deterministic default, so SSR and the first
  // client render agree (no hydration mismatch).
  useEffect(() => {
    hydrateGroups();
  }, []);
  const navigation = navigationForUser(isPlatformOwner);

  const toggleGroup = useCallback((group: string) => {
    updateGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center border-b px-3.5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Same brand artwork as the favicon (public/Logo.png). */}
          <Image
            src="/Logo.png"
            alt="AOT CRM logo"
            width={28}
            height={28}
            priority
            className="h-7 w-7 shrink-0 rounded-md object-contain"
          />
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
            activeHref={activeHref}
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
          "fixed left-0 top-0 z-30 hidden h-full flex-col border-r border-border bg-sidebar transition-all duration-200 lg:flex",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        {sidebarContent}
      </aside>

      <div
        className={clsx(
          "hidden transition-all duration-200 lg:block",
          collapsed ? "w-[60px]" : "w-[220px]"
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
                  <Image
                    src="/Logo.png"
                    alt="AOT CRM logo"
                    width={28}
                    height={28}
                    priority
                    className="h-7 w-7 rounded-md object-contain"
                  />
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
                    activeHref={activeHref}
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
