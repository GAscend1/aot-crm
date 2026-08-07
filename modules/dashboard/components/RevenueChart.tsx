"use client";

import { useState, useEffect } from "react";

interface MonthlyData {
  month: string;
  revenue: number;
  paid: number;
  target: number;
}

const VIEWS = [
  { key: "revenue", label: "Won" },
  { key: "paid", label: "Paid" },
  { key: "target", label: "Target" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

export function RevenueChart() {
  const [view, setView] = useState<ViewKey>("revenue");
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/revenue");
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setMonthlyData(json.monthlyRevenue || []);
        }
      } catch {
        // Silently fail
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (monthlyData.length === 0) return null;

  const maxValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.revenue, m.paid, m.target)),
    1
  );

  const barColor: Record<ViewKey, string> = {
    revenue: "bg-[color:var(--primary)]",
    paid: "bg-[color:var(--success)]",
    target: "bg-muted-foreground/40",
  };

  return (
    <div className="rounded-xl border bg-surface-raised shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="font-semibold">Revenue Overview</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Won vs paid revenue and 12-month average target
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                view === v.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-end gap-2" style={{ height: 200 }}>
          {monthlyData.map((m) => {
            const value = m[view];
            const height = (value / maxValue) * 100;

            return (
              <div
                key={m.month}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-[10px] text-muted-foreground/70">
                  ${(value / 1000).toFixed(0)}k
                </span>
                <div
                  className={`w-full rounded-t ${barColor[view]}`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[11px] font-medium text-foreground/70">
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
