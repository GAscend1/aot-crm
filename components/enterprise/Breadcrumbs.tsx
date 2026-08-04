"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  companies: "Companies",
  contacts: "People",
  leads: "Leads",
  opportunities: "Opportunities",
  activities: "Activities",
  tickets: "Tickets",
  documents: "Documents",
  reports: "Reports",
  administration: "Administration",
  quotes: "Quotes",
  invoices: "Invoices",
  kanban: "Pipeline",
  calendar: "Calendar",
  email: "Email",
  meetings: "Meetings",
  files: "Files",
  profile: "Profile",
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
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {segments.slice(0, -1).map((segment) => (
        <span key={segment.href} className="flex items-center gap-1.5">
          <Link
            href={segment.href}
            className="rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {segment.label}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      ))}
      <span
        aria-current="page"
        className="max-w-[220px] truncate font-medium text-foreground"
      >
        {segments[segments.length - 1].label}
      </span>
    </nav>
  );
}
