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
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-semibold">Quick Actions</h2>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
