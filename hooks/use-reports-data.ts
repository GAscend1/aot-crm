"use client";

import { useState, useEffect } from "react";

export interface ReportsData {
  revenue: number;
  pipelineValue: number;
  winRate: number;
  activeDeals: number;
  leadsGenerated: number;
  conversionRate: number;
  customersTotal: number;
  ticketsTotal: number;
  pipelineData: Array<{ stage: string; value: number; count: number }>;
  leadSources: Array<{ name: string; value: number }>;
}

const emptyData: ReportsData = {
  revenue: 0,
  pipelineValue: 0,
  winRate: 0,
  activeDeals: 0,
  leadsGenerated: 0,
  conversionRate: 0,
  customersTotal: 0,
  ticketsTotal: 0,
  pipelineData: [],
  leadSources: [],
};

export function useReportsData(refreshInterval = 60000): ReportsData {
  const [data, setData] = useState<ReportsData>(emptyData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const json = await res.json();
          setData((prev) => ({
            ...prev,
            ...json,
          }));
        }
      } catch {
        // Keep current data
      }
    };
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return data;
}
