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
  /**
   * AOT SaaS Platform Owner only. The item is filtered OUT of every module
   * discovery surface (sidebar, mobile, command palette, tour) for everyone
   * else — it must not even appear as a disabled entry. Direct route access
   * is independently protected by the server (redirect + 403 on /api/platform/*).
   */
  ownerOnly?: boolean;
}

export interface NavigationGroup {
  group: string;
  icon?: React.ElementType;
  items: NavigationItem[];
}

/**
 * Legacy module routes that were merged into canonical modules as filtered
 * views (Phase 2). Deep links and full-page records under these prefixes are
 * normalized to the canonical module so the SIDEBAR highlights the canonical
 * item instead of surfacing a redundant hidden module (e.g. visiting
 * /customers/<uuid> highlights Contacts — never a separate "Customers" item).
 */
const LEGACY_MODULE_MAP: Record<string, string> = {
  customers: "contacts",
  leads: "contacts",
  files: "documents",
  inbox: "activities",
};

/**
 * Maps a legacy module path to its canonical module path (e.g.
 * /customers/abc → /contacts/abc). Non-legacy paths are returned unchanged.
 */
export function canonicalModulePath(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0];
  const first = path.split("/").filter(Boolean)[0];
  const canonical = first ? LEGACY_MODULE_MAP[first] : undefined;
  if (!canonical) return path;
  return `/${canonical}${path.slice(first.length + 1)}`;
}

/**
 * Resolves the single nav item that should be highlighted for a pathname.
 *
 * Matching rules (longest-prefix wins so child views never double-highlight):
 * - Legacy module prefixes (/customers*, /leads*, /files*, /inbox*) are first
 *   normalized to their canonical module so a full-page record never surfaces
 *   a redundant hidden sidebar item.
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
  const path = canonicalModulePath(pathname);
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

/**
 * Phase 2 navigation — simplified to the core destinations. Every hidden item
 * still resolves (deep links, command palette, active-state contract) but is
 * surfaced as a VIEW inside the module listed in its comment.
 */
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
      // Merged into Contacts as a "Leads" view (redirected to
      // /contacts?view=leads).
      {
        title: "Leads",
        href: "/leads",
        icon: Target,
        hidden: true,
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
    group: "Work",
    icon: ClipboardList,
    items: [
      {
        title: "Activities",
        href: "/activities",
        icon: ClipboardList,
      },
      {
        title: "Tickets",
        href: "/tickets",
        icon: Ticket,
      },
      // Merged into Activities as the "Email" view (redirected to
      // /activities?view=email).
      {
        title: "Inbox",
        href: "/inbox",
        icon: Inbox,
        hidden: true,
      },
    ],
  },

  {
    group: "Documents",
    icon: FolderOpen,
    items: [
      {
        title: "Documents",
        href: "/documents",
        icon: FolderOpen,
      },
    ],
  },

  {
    group: "Reports",
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
    group: "Administration",
    icon: Shield,
    items: [
      {
        title: "Administration",
        href: "/administration",
        icon: Shield,
        ownerOnly: true,
      },
    ],
  },
];

/**
 * Navigation filtered for a caller's access level. Non-Platform Owners never
 * see ownerOnly items — the Administration entry simply does not exist for
 * them. Kept in the config so deep links + the active-state contract still
 * resolve for the owner; server routes enforce the same rule independently.
 */
export function navigationForUser(owner: boolean): NavigationGroup[] {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.ownerOnly || owner),
    }))
    .filter((group) => group.items.length > 0);
}
