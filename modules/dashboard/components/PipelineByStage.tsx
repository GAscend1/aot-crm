"use client";

import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const STAGE_COLORS: Record<string, string> = {
  Discovery: "#6366f1",
  Qualification: "#0ea5e9",
  Proposal: "#f59e0b",
  Negotiation: "#ec4899",
  "Closed Won": "#10b981",
  "Closed Lost": "#ef4444",
};

interface PipelineRow {
  stage: string;
  count: number;
  value: number;
}

interface TooltipEntry {
  name: string;
  value: number;
  payload?: PipelineRow;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="text-sm font-medium text-slate-900">{entry.name}</p>
      <p className="text-sm text-slate-600">
        {entry.value} deal{entry.value === 1 ? "" : "s"} · ${(entry.payload?.value ?? 0).toLocaleString()}
      </p>
    </div>
  );
}

export function PipelineByStage() {
  const { pipelineByStage } = useDashboardData();

  if (pipelineByStage.length === 0) {
    return (
      <SectionCard title="Pipeline by Stage">
        <EmptyState
          compact
          title="No pipeline data"
          description="Opportunities grouped by stage will appear here."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Pipeline by Stage">
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={pipelineByStage}
              dataKey="count"
              nameKey="stage"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {pipelineByStage.map((entry) => (
                <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend />
          </RePieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-1.5">
        {pipelineByStage.map((s) => (
          <div key={s.stage} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STAGE_COLORS[s.stage] || "#94a3b8" }}
              />
              {s.stage}
            </span>
            <span className="font-medium tabular-nums text-slate-900">
              ${(s.value / 1000).toFixed(0)}k · {s.count}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
