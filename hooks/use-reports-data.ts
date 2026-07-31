"use client";

import { useCallback, useEffect, useState } from "react";

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
};

export function useReportsData(filters?: ReportFilters): { data: ReportsData; loading: boolean; refresh: () => void } {
  const [data, setData] = useState<ReportsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const { range, from, to, ownerId, customerId, companyId, source, stage, status } = filters ?? {};

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (range) params.set("range", range);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (ownerId) params.set("ownerId", ownerId);
    if (customerId) params.set("customerId", customerId);
    if (companyId) params.set("companyId", companyId);
    if (source) params.set("source", source);
    if (stage) params.set("stage", stage);
    if (status) params.set("status", status);
    const qs = params.toString();
    fetch(`/api/reports${qs ? `?${qs}` : ""}`)
      .then((res) => (res.ok ? res.json() : emptyData))
      .then((json) => {
        if (!cancelled) {
          setData({ ...emptyData, ...json });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [range, from, to, ownerId, customerId, companyId, source, stage, status, refreshKey]);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  return { data, loading, refresh };
}
