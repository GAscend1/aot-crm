import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Contact,
  FolderOpen,
  LayoutDashboard,
  PieChart,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Users,
  User,
  FileIcon,
  FileText,
  Receipt,
  Ticket,
  Kanban,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: React.ElementType;
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
      },
      {
        title: "Files",
        href: "/files",
        icon: FileIcon,
      },
      {
        title: "Profile",
        href: "/profile",
        icon: User,
      },
    ],
  },

  {
    group: "CRM",
    icon: TrendingUp,
    items: [
      {
        title: "Customers",
        href: "/customers",
        icon: Users,
      },
      {
        title: "Companies",
        href: "/companies",
        icon: Building2,
      },
      {
        title: "Contacts",
        href: "/contacts",
        icon: Contact,
      },
      {
        title: "Leads",
        href: "/leads",
        icon: Target,
      },
      {
        title: "Opportunities",
        href: "/opportunities",
        icon: Briefcase,
      },
    ],
  },

  {
    group: "Sales",
    icon: Kanban,
    items: [
      {
        title: "Pipeline",
        href: "/opportunities/kanban",
        icon: Kanban,
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
    group: "Operations",
    icon: Settings,
    items: [
      {
        title: "Activities",
        href: "/activities",
        icon: ClipboardList,
      },
      {
        title: "Calendar",
        href: "/activities/calendar",
        icon: CalendarDays,
      },
      {
        title: "Tickets",
        href: "/tickets",
        icon: Ticket,
      },
      {
        title: "Documents",
        href: "/documents",
        icon: FolderOpen,
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
