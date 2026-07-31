"use client";

import { useState, useEffect, useCallback } from "react";

export interface DashboardData {
  kpis: Array<{ title: string; value: string | number; change: number }>;
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
  }>;
}

const defaultData: DashboardData = {
  kpis: [],
  recentCustomers: [],
  recentCompanies: [],
  recentOpportunities: [],
  recentTickets: [],
  recentTasks: [],
};

export function useDashboardData(refreshInterval = 30000): DashboardData & { refresh: () => void } {
  const [data, setData] = useState<DashboardData>(defaultData);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // Silently fail; data stays at previous value
      }
    }
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshInterval, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { ...data, refresh };
}
