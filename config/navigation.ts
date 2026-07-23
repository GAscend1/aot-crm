import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  Contact,
  FolderOpen,
  LayoutDashboard,
  Shield,
  Target,
  Ticket,
  Users,
} from "lucide-react";

import { UserRole } from "./roles";

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

export interface NavigationGroup {
  group: string;
  items: NavigationItem[];
}

export const navigation: NavigationGroup[] = [
  {
    group: "General",
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
    ],
  },

  {
    group: "Operations",
    items: [
      {
        title: "Activities",
        href: "/activities",
        icon: ClipboardList,
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
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
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