import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  Contact,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  PieChart,
  Receipt,
  Shield,
  Target,
  Ticket,
  TrendingUp,
  User,
  Users,
  FileIcon,
  FileText,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  /**
   * Kept in the config (for deep links, the command palette, and the active
   * state contract) but hidden from the primary sidebar. These modules were
   * merged into smarter workspaces as filtered views.
   */
  hidden?: boolean;
}

export interface NavigationGroup {
  group: string;
  icon?: React.ElementType;
  items: NavigationItem[];
}

/**
 * Resolves the single nav item that should be highlighted for a pathname.
 *
 * Matching rules (longest-prefix wins so child views never double-highlight):
 * - Exact `pathname === href` matches the item directly.
 * - `pathname.startsWith(href + "/")` matches a parent module for a child view
 *   (e.g. /opportunities/kanban matches /opportunities, /activities/calendar
 *   matches /activities).
 * - The longest matching href wins; if nothing matches, returns null.
 * - Query strings and hashes are ignored (usePathname never includes them).
 *
 * This guarantees at most one sidebar item is ever active.
 */
export function findActiveItemHref(pathname: string): string | null {
  const path = pathname.split("?")[0].split("#")[0];
  let best: string | null = null;
  for (const group of navigation) {
    for (const item of group.items) {
      const href = item.href;
      const matches = path === href || path.startsWith(href + "/");
      if (matches && (best === null || href.length > best.length)) {
        best = href;
      }
    }
  }
  return best;
}

export const navigation: NavigationGroup[] = [
  {
    group: "General",
    icon: LayoutDashboard,
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      // Merged into Documents; kept for deep links and the command palette.
      {
        title: "Files",
        href: "/files",
        icon: FileIcon,
        hidden: true,
      },
      {
        title: "Profile",
        href: "/profile",
        icon: User,
        hidden: true,
      },
    ],
  },

  {
    group: "CRM",
    icon: Users,
    items: [
      {
        title: "Companies",
        href: "/companies",
        icon: Building2,
      },
      {
        title: "Contacts",
        href: "/contacts",
        icon: Users,
      },
      // Merged into Contacts as a "Customers" view (redirected to
      // /contacts?view=customers).
      {
        title: "Customers",
        href: "/customers",
        icon: Contact,
        hidden: true,
      },
      {
        title: "Documents",
        href: "/documents",
        icon: FolderOpen,
      },
    ],
  },

  {
    group: "Sales",
    icon: TrendingUp,
    items: [
      {
        title: "Opportunities",
        href: "/opportunities",
        icon: Briefcase,
      },
      {
        title: "Leads",
        href: "/leads",
        icon: Target,
      },
      {
        title: "Quotes",
        href: "/quotes",
        icon: FileText,
      },
      {
        title: "Invoices",
        href: "/invoices",
        icon: Receipt,
      },
    ],
  },

  {
    group: "Communication",
    icon: Inbox,
    items: [
      {
        title: "Inbox",
        href: "/inbox",
        icon: Inbox,
      },
      {
        title: "Activities",
        href: "/activities",
        icon: ClipboardList,
      },
    ],
  },

  {
    group: "Support",
    icon: Ticket,
    items: [
      {
        title: "Tickets",
        href: "/tickets",
        icon: Ticket,
      },
    ],
  },

  {
    group: "Insights",
    icon: PieChart,
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },

  {
    group: "Management",
    icon: Shield,
    items: [
      {
        title: "Administration",
        href: "/administration",
        icon: Shield,
      },
    ],
  },
];
