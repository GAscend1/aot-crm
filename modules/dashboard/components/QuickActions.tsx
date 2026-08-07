import Link from "next/link";
import {
  Plus,
  UserPlus,
  Building2,
  Target,
  FileText,
} from "lucide-react";

const actions = [
  { label: "Add Customer", icon: UserPlus, href: "/customers" },
  { label: "Add Company", icon: Building2, href: "/companies" },
  { label: "Add Lead", icon: Target, href: "/leads" },
  { label: "New Opportunity", icon: Plus, href: "/opportunities" },
  { label: "New Report", icon: FileText, href: "/reports" },
] as const;

export function QuickActions() {
  return (
    <div className="rounded-xl border bg-surface-raised p-6 shadow-sm">
      <h2 className="mb-4 font-semibold">Quick Actions</h2>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border bg-surface-raised px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
