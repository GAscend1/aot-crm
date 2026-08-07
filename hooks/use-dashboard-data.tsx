"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client/api";
import type { DashboardData } from "@/lib/types/dashboard";

export const dashboardQueryKey = ["dashboard"] as const;

const defaultData: DashboardData = {
  kpis: [],
  recentCustomers: [],
  recentCompanies: [],
  recentOpportunities: [],
  recentTickets: [],
  recentTasks: [],
  upcomingMeetings: [],
  pipelineByStage: [],
  topOwners: [],
  forecast: { months: [], totals: { committed: 0, weighted: 0, best: 0 } },
  customerHealth: {
    distribution: [],
    healthy: 0,
    atRisk: 0,
    needsAttention: 0,
    atRiskCompanies: [],
    topCompanies: [],
  },
};

async function fetchDashboard(): Promise<DashboardData> {
  return fetchJson<DashboardData>("/api/dashboard");
}

interface DashboardContextValue {
  data: DashboardData;
  refresh: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

/**
 * Holds the single /api/dashboard query and shares it with every dashboard
 * widget. Without this, each widget mounts its own 30s poller — 9 duplicate
 * requests per cycle.
 */
export function DashboardDataProvider({
  initialData,
  refreshInterval = 30_000,
  children,
}: {
  initialData?: DashboardData;
  refreshInterval?: number;
  children: ReactNode;
}) {
  const query = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboard,
    initialData: initialData ?? undefined,
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
  });

  const { data, refetch } = query;
  const refresh = useCallback(() => void refetch(), [refetch]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      data: data ?? defaultData,
      refresh,
    }),
    [data, refresh],
  );

  return <DashboardContext value={value}>{children}</DashboardContext>;
}

export function useDashboardData(): DashboardData & { refresh: () => void } {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used within a DashboardDataProvider");
  }
  return { ...ctx.data, refresh: ctx.refresh };
}
