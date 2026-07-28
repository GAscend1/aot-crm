"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  companies: "Companies",
  contacts: "Contacts",
  leads: "Leads",
  opportunities: "Opportunities",
  activities: "Activities",
  tickets: "Tickets",
  documents: "Documents",
  reports: "Reports",
  administration: "Administration",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  const segments = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string }[] = [{ label: "Home", href: "/dashboard" }];

    let current = "";
    for (const part of parts) {
      if (part === "(app)") continue;
      current += `/${part}`;
      const label = labelMap[part] || part.charAt(0).toUpperCase() + part.slice(1);
      crumbs.push({ label, href: current });
    }

    return crumbs;
  }, [pathname]);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500">
      {segments.slice(0, -1).map((segment) => (
        <span key={segment.href} className="flex items-center gap-1.5">
          <Link
            href={segment.href}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {segment.label}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      ))}
      <span className="font-semibold text-slate-900 dark:text-white">
        {segments[segments.length - 1].label}
      </span>
    </nav>
  );
}
