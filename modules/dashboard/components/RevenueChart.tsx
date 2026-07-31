"use client";

import { useState, useEffect } from "react";

interface MonthlyData {
  month: string;
  revenue: number;
  target: number;
}

export function RevenueChart() {
  const [view, setView] = useState<"revenue" | "target">("revenue");
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/revenue");
        if (res.ok) {
          const json = await res.json();
          setMonthlyData(json.monthlyRevenue || []);
        }
      } catch {
        // Silently fail
      }
    };
    fetchData();
  }, []);

  if (monthlyData.length === 0) return null;

  const maxValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.revenue, m.target))
  );

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Revenue Overview</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Monthly revenue vs targets
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
          <button
            onClick={() => setView("revenue")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              view === "revenue"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setView("target")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              view === "target"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Target
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-end gap-2" style={{ height: 200 }}>
          {monthlyData.map((m) => {
            const value = view === "revenue" ? m.revenue : m.target;
            const height = (value / maxValue) * 100;

            return (
              <div
                key={m.month}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] text-slate-400">
                  ${(value / 1000).toFixed(0)}k
                </span>
                <div
                  className={`w-full rounded-t ${
                    view === "revenue"
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[11px] font-medium text-slate-600">
                  {m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
