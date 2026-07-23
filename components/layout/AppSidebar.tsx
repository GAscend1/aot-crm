"use client";

import Link from "next/link";
import { navigation } from "@/config/navigation";

export function AppSidebar() {
  return (
    <aside className="hidden h-screen w-[260px] border-r bg-white lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold tracking-tight">
          AOT CRM
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navigation.map((group) => (
          <div key={group.group} className="mb-6">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.group}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
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