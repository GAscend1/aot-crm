/**
 * Shared dashboard payload shape. Lives in `lib/types` (neutral) so both the
 * server aggregation (`lib/server/dashboard-data.ts`) and the client hook
 * (`hooks/use-dashboard-data.tsx`) depend on the same definition without a
 * server → "use client" import edge.
 */

export interface DashboardData {
  // `change` is null when no meaningful trend exists (e.g. forecast totals
  // have no previous-period baseline); the KPI card then omits the trend chip.
  kpis: Array<{ title: string; value: string | number; change: number | null }>;
  recentCustomers: Array<{
    id: string;
    name: string;
    company: string;
    email: string | null;
    status: string;
    createdAt: string;
  }>;
  recentCompanies: Array<{
    id: string;
    name: string;
    industry: string | null;
    city: string | null;
    country: string | null;
    status: string;
    createdAt: string;
  }>;
  recentOpportunities: Array<{
    id: string;
    title: string;
    customer: string;
    value: number;
    stage: string;
    probability: number;
    createdAt: string;
  }>;
  recentTickets: Array<{
    id: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
  }>;
  recentTasks: Array<{
    id: string;
    subject: string;
    status: string;
    dueDate: string;
    priority: string;
    assignee: string;
    overdue: boolean;
  }>;
  upcomingMeetings: Array<{
    id: string;
    subject: string;
    dueDate: string;
    assignee: string;
    related: string;
  }>;
  pipelineByStage: Array<{ stage: string; count: number; value: number }>;
  topOwners: Array<{ name: string; wonValue: number; wonCount: number; activeDeals: number }>;
  forecast: {
    months: Array<{ month: string; committed: number; weighted: number; best: number }>;
    totals: { committed: number; weighted: number; best: number };
  };
  customerHealth: {
    distribution: Array<{ name: string; value: number }>;
    healthy: number;
    atRisk: number;
    needsAttention: number;
    atRiskCompanies: Array<{
      id: string;
      name: string;
      industry: string | null;
      score: number;
      label: string;
      tone: string;
      pipelineValue: number;
      wonRevenue: number;
      openTickets: number;
      peopleCount: number;
    }>;
    topCompanies: Array<{
      id: string;
      name: string;
      industry: string | null;
      score: number;
      label: string;
      tone: string;
      pipelineValue: number;
      wonRevenue: number;
      openTickets: number;
      peopleCount: number;
    }>;
  };
}
