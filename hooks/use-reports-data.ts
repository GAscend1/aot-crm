"use client";

import { useQuery } from "@tanstack/react-query";
import { buildQueryString } from "@/lib/client/api";

export interface ReportFilters {
  range: "today" | "7d" | "30d" | "month" | "quarter" | "year" | "custom";
  from?: string;
  to?: string;
  ownerId?: string;
  customerId?: string;
  companyId?: string;
  source?: string;
  stage?: string;
  status?: string;
}

export interface ReportsData {
  range: { from: string; to: string };
  kpis: {
    revenue: number;
    pipelineValue: number;
    winRate: number;
    activeDeals: number;
    leadsGenerated: number;
    conversionRate: number;
    customersTotal: number;
    companiesTotal: number;
    ticketsTotal: number;
    quotesTotal: number;
    quoteAcceptanceRate: number;
    avgQuoteValue: number;
    quoteTotalValue: number;
    invoicesTotal: number;
    paidRevenue: number;
    outstandingRevenue: number;
    overdueRevenue: number;
  };
  pipelineData: Array<{ stage: string; count: number; value: number }>;
  funnelData: Array<{ stage: string; count: number }>;
  stageConversionRate: Array<{ stage: string; conversionRate: number }>;
  avgDaysInStage: Array<{ stage: string; days: number }>;
  wonVsLost: Array<{ name: string; value: number }>;
  expectedRevenue: number;
  weightedRevenue: number;
  leadSources: Array<{ name: string; value: number }>;
  leadByStatus: Array<{ name: string; value: number }>;
  leadFunnel: Array<{ stage: string; count: number }>;
  revenueTrend: Array<{ month: string; revenue: number }>;
  paymentTrend: Array<{ month: string; revenue: number }>;
  revenueByCustomer: Array<{ name: string; value: number }>;
  revenueByOwner: Array<{ name: string; value: number }>;
  revenueByCompany: Array<{ name: string; value: number }>;
  quotesByStatus: Array<{ name: string; value: number }>;
  quoteTrend: Array<{ month: string; value: number }>;
  invoicesByStatus: Array<{ name: string; value: number }>;
  customersByMonth: Array<{ month: string; count: number }>;
  ticketsByStatus: Array<{ name: string; value: number }>;
  activitiesOverTime: Array<{ month: string; calls: number; emails: number; meetings: number; tasks: number }>;
  users: Array<{ id: string; name: string }>;
  // Phase 6 analytics blocks
  /** True when the plan grants the advanced_analytics entitlement (blocks present). */
  advancedAnalytics: boolean;
  velocity: {
    avgCycleDays: number;
    velocityPerDay: number;
    dealsMovedByStage: Array<{ stage: string; count: number }>;
  };
  forecast: {
    months: Array<{ month: string; committed: number; weighted: number; best: number }>;
    totals: { committed: number; weighted: number; best: number };
  };
  winLoss: {
    wonByReason: Array<{ name: string; value: number; count: number }>;
    lostByReason: Array<{ name: string; value: number; count: number }>;
    winRateTrend: Array<{ month: string; won: number; lost: number; winRate: number }>;
    wonValue: number;
    lostValue: number;
  };
  teamProductivity: Array<{
    name: string;
    wonValue: number;
    wonCount: number;
    activeDeals: number;
    winRate: number;
    tasksCompleted: number;
    meetingsHeld: number;
    callsMade: number;
    emailsSent: number;
  }>;
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

const emptyData: ReportsData = {
  range: { from: "", to: "" },
  kpis: {
    revenue: 0,
    pipelineValue: 0,
    winRate: 0,
    activeDeals: 0,
    leadsGenerated: 0,
    conversionRate: 0,
    customersTotal: 0,
    companiesTotal: 0,
    ticketsTotal: 0,
    quotesTotal: 0,
    quoteAcceptanceRate: 0,
    avgQuoteValue: 0,
    quoteTotalValue: 0,
    invoicesTotal: 0,
    paidRevenue: 0,
    outstandingRevenue: 0,
    overdueRevenue: 0,
  },
  pipelineData: [],
  funnelData: [],
  stageConversionRate: [],
  avgDaysInStage: [],
  wonVsLost: [],
  expectedRevenue: 0,
  weightedRevenue: 0,
  leadSources: [],
  leadByStatus: [],
  leadFunnel: [],
  revenueTrend: [],
  paymentTrend: [],
  revenueByCustomer: [],
  revenueByOwner: [],
  revenueByCompany: [],
  quotesByStatus: [],
  quoteTrend: [],
  invoicesByStatus: [],
  customersByMonth: [],
  ticketsByStatus: [],
  activitiesOverTime: [],
  users: [],
  advancedAnalytics: false,
  velocity: { avgCycleDays: 0, velocityPerDay: 0, dealsMovedByStage: [] },
  forecast: { months: [], totals: { committed: 0, weighted: 0, best: 0 } },
  winLoss: { wonByReason: [], lostByReason: [], winRateTrend: [], wonValue: 0, lostValue: 0 },
  teamProductivity: [],
  customerHealth: {
    distribution: [],
    healthy: 0,
    atRisk: 0,
    needsAttention: 0,
    atRiskCompanies: [],
    topCompanies: [],
  },
};

export function useReportsData(filters?: ReportFilters): { data: ReportsData; loading: boolean; refresh: () => void } {
  const { range, from, to, ownerId, customerId, companyId, source, stage, status } = filters ?? {};

  const query = useQuery<ReportsData>({
    queryKey: ["reports", range, from, to, ownerId, customerId, companyId, source, stage, status],
    queryFn: async () => {
      const res = await fetch(`/api/reports${buildQueryString({
        range,
        from,
        to,
        ownerId,
        customerId,
        companyId,
        source,
        stage,
        status,
      })}`);
      if (!res.ok) return emptyData;
      const json = await res.json();
      return { ...emptyData, ...json };
    },
    staleTime: 60_000,
  });

  return {
    data: query.data ?? emptyData,
    loading: query.isPending,
    refresh: () => void query.refetch(),
  };
}
