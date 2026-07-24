"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { navigation } from "@/config/navigation";
import { useSidebar } from "@/components/layout/SidebarProvider";

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      className={clsx(
        "hidden h-screen border-r bg-white transition-all duration-300 lg:flex lg:flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          "flex h-16 items-center border-b",
          collapsed ? "justify-center" : "px-6"
        )}
      >
        {collapsed ? (
          <span className="text-xl font-bold">A</span>
        ) : (
          <h1 className="text-xl font-bold tracking-tight">
            AOT CRM
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navigation.map((group) => (
          <div key={group.group} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {group.group}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.title : undefined}
                    className={clsx(
                      "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                      collapsed
                        ? "justify-center p-3"
                        : "gap-3 px-3 py-2",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />

                    {!collapsed && (
                      <span>{item.title}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}