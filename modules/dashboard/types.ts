export interface DashboardKPI {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  target: number;
}

export interface RecentActivity {
  id: string;
  type: "customer" | "opportunity" | "ticket" | "lead" | "task";
  action: string;
  subject: string;
  timestamp: string;
  user: string;
}

export interface RecentCustomer {
  id: string;
  name: string;
  company: string;
  email: string;
  status: "Active" | "Inactive" | "Prospect";
  createdAt: string;
}

export interface RecentOpportunity {
  id: string;
  title: string;
  customer: string;
  value: number;
  stage: string;
  probability: number;
  createdAt: string;
}

export interface UpcomingTask {
  id: string;
  title: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  assignee: string;
  completed: boolean;
}

export interface RecentCompany {
  id: string;
  name: string;
  industry: string;
  city: string;
  country: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
