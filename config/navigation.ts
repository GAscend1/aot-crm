import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Contact,
  FolderOpen,
  Kanban,
  LayoutDashboard,
  PieChart,
  Settings,
  Shield,
  Target,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

import { UserRole } from "./roles";

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: string;
}

export interface NavigationGroup {
  group: string;
  icon?: React.ElementType;
  items: NavigationItem[];
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
        roles: Object.values(UserRole),
      },
    ],
  },

  {
    group: "Sales",
    icon: TrendingUp,
    items: [
      {
        title: "Customers",
        href: "/customers",
        icon: Users,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SALES_MANAGER,
          UserRole.SALES,
        ],
      },
      {
        title: "Companies",
        href: "/companies",
        icon: Building2,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SALES_MANAGER,
          UserRole.SALES,
        ],
      },
      {
        title: "Contacts",
        href: "/contacts",
        icon: Contact,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SALES_MANAGER,
          UserRole.SALES,
        ],
      },
      {
        title: "Leads",
        href: "/leads",
        icon: Target,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SALES_MANAGER,
          UserRole.SALES,
        ],
      },
      {
        title: "Opportunities",
        href: "/opportunities",
        icon: Briefcase,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SALES_MANAGER,
          UserRole.SALES,
        ],
      },
      {
        title: "Pipeline",
        href: "/opportunities/kanban",
        icon: Kanban,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SALES_MANAGER,
          UserRole.SALES,
        ],
      },
    ],
  },

  {
    group: "Operations",
    icon: Settings,
    items: [
      {
        title: "Activities",
        href: "/activities",
        icon: ClipboardList,
        roles: Object.values(UserRole),
      },
      {
        title: "Calendar",
        href: "/activities/calendar",
        icon: CalendarDays,
        roles: Object.values(UserRole),
      },
      {
        title: "Tickets",
        href: "/tickets",
        icon: Ticket,
        roles: Object.values(UserRole),
      },
      {
        title: "Documents",
        href: "/documents",
        icon: FolderOpen,
        roles: Object.values(UserRole),
      },
    ],
  },

  {
    group: "Analytics",
    icon: PieChart,
    items: [
      {
        title: "Dashboard",
        href: "/reports",
        icon: BarChart3,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SALES_MANAGER,
        ],
      },
      {
        title: "Reports",
        href: "/reports/manage",
        icon: PieChart,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.SALES_MANAGER,
        ],
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
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
        ],
      },
    ],
  },
];