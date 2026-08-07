"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ClipboardList,
  Building2,
} from "lucide-react";
import clsx from "clsx";

import { findActiveItemHref } from "@/config/navigation";

/** Top 5 destinations surfaced as a mobile bottom tab bar. */
const QUICK_NAV = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "People", href: "/contacts", icon: Users },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Deals", href: "/opportunities", icon: Briefcase },
  { label: "Work", href: "/activities", icon: ClipboardList },
];

/**
 * Mobile quick navigation — a fixed bottom tab bar (visible below lg) so the
 * five most-used destinations are always one tap away, complementing the
 * drawer sidebar for full navigation.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const activeHref = findActiveItemHref(pathname);

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/90 lg:hidden"
    >
      <div className="grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {QUICK_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-150",
                active
                  ? "text-[color:var(--primary)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
