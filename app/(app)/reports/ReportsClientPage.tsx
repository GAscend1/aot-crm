"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Ticket,
  Briefcase,
  Building2,
  FileText,
  Receipt,
  Download,
  BarChart3,
  Percent,
  Gauge,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
  HeartPulse,
  Trophy,
  XCircle,
} from "lucide-react";

import { PageLayout } from "@/components/common/PageLayout";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReportsData, type ReportFilters } from "@/hooks/use-reports-data";
import { useChartPalette } from "@/components/charts/use-chart-palette";
import { FeatureGate } from "@/components/subscription/FeatureGate";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Funnel,
  FunnelChart,
  LabelList,
} from "recharts";

const rangeOptions: { value: ReportFilters["range"]; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "month", label: "Current Month" },
  { value: "quarter", label: "Current Quarter" },
  { value: "year", label: "Current Year" },
  { value: "custom", label: "Custom Range" },
];

const stageOptions = ["Discovery", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

interface TooltipEntry {
  name: string;
  value: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-slate-900 dark:border-slate-700">
      <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportsClientPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ReportFilters>({ range: "year" });
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const { data, loading, refresh } = useReportsData(filters);
  const { palette, primary } = useChartPalette();

  /** Drill-down navigation into module pages with the relevant context. */
  const drillTo = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router],
  );

  const kpis = data.kpis;

  const updateFilter = (patch: Partial<ReportFilters>) => {
    const next = { ...filters, ...patch };
    if (next.range === "custom" && customFrom && customTo) {
      next.from = customFrom;
      next.to = customTo;
    }
    setFilters(next);
  };

  const appliedFilters = useMemo(() => {
    const parts: string[] = [];
    if (data.range.from && data.range.to) {
      parts.push(`${data.range.from} → ${data.range.to}`);
    } else if (filters.range !== "year") {
      parts.push(filters.range);
    }
    if (filters.stage) parts.push(filters.stage);
    if (filters.source) parts.push(`Source: ${filters.source}`);
    return parts;
  }, [data.range, filters]);

  const downloadCsv = useCallback((filename: string, rows: (string | number)[][]) => {
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportReport = useCallback(() => {
    const rows: (string | number)[][] = [
      ["AOT CRM — Sales Analytics Export"],
      [`Range: ${appliedFilters.join(", ") || "Current Year"}`],
      [],
      ["KPI", "Value"],
      ["Revenue (Won)", kpis.revenue],
      ["Pipeline Value", kpis.pipelineValue],
      ["Win Rate", `${kpis.winRate}%`],
      ["Active Deals", kpis.activeDeals],
      ["Leads Generated", kpis.leadsGenerated],
      ["Conversion Rate", `${kpis.conversionRate}%`],
      ["Quotes", kpis.quotesTotal],
      ["Invoices", kpis.invoicesTotal],
      ["Paid Revenue", kpis.paidRevenue],
      ["Outstanding", kpis.outstandingRevenue],
      ["Overdue", kpis.overdueRevenue],
    ];
    // Advanced analytics blocks are only included when the plan grants the
    // entitlement (the server also omits the data for non-entitled plans).
    if (data.advancedAnalytics) {
      rows.push(
        [],
        ["Velocity", "Value"],
        ["Avg Sales Cycle (days)", data.velocity.avgCycleDays],
        ["Pipeline Velocity ($/day)", data.velocity.velocityPerDay],
        [],
        ["Forecast (next months)", "Committed", "Weighted", "Best"],
        ...data.forecast.months.map((m) => [m.month, m.committed, m.weighted, m.best]),
        [],
        ["Win/Loss Reason", "Won Value", "Won Count"],
        ...data.winLoss.wonByReason.map((r) => [r.name, r.value, r.count]),
        ["Loss Reason", "Lost Value", "Lost Count"],
        ...data.winLoss.lostByReason.map((r) => [r.name, r.value, r.count]),
        [],
        ["Team Productivity", "Won Value", "Won", "Active", "Win Rate", "Tasks", "Meetings", "Calls", "Emails"],
        ...data.teamProductivity.map((t) => [t.name, t.wonValue, t.wonCount, t.activeDeals, `${t.winRate}%`, t.tasksCompleted, t.meetingsHeld, t.callsMade, t.emailsSent]),
      );
    }
    downloadCsv("sales-analytics.csv", rows);
  }, [appliedFilters, data, downloadCsv, kpis]);

  return (
    <FeatureGate feature="reports" featureLabel="Sales reports">
      <PageLayout
        title="Sales Analytics"
        description="Enterprise business intelligence across the entire sales workflow."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Link href="/reports/manage">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Manage Reports
              </Button>
            </Link>
          </div>
        }
      >
      {/* Filter bar */}
      <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filters.range} onValueChange={(v) => updateFilter({ range: v as ReportFilters["range"] })}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filters.range === "custom" && (
            <div className="flex items-center gap-2">
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-40" />
              <span className="text-xs text-slate-400">to</span>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-40" />
              <Button size="sm" variant="outline" onClick={() => updateFilter({ from: customFrom, to: customTo })}>
                Apply
              </Button>
            </div>
          )}

          <Select value={filters.ownerId ?? "all"} onValueChange={(v) => updateFilter({ ownerId: v === "all" ? undefined : v })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {data.users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name || "Unnamed"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.stage ?? "all"} onValueChange={(v) => updateFilter({ stage: v === "all" ? undefined : v })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stageOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={refresh} title="Refresh">
            <BarChart3 className="h-4 w-4" />
          </Button>

          {appliedFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {appliedFilters.map((f) => (
                <span key={f} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI row 1 — Revenue & Pipeline */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue (Won)" value={loading ? "…" : `$${(kpis.revenue / 1000).toFixed(0)}k`} icon={DollarSign} variant="success" />
        <StatCard title="Pipeline Value" value={loading ? "…" : `$${(kpis.pipelineValue / 1000).toFixed(0)}k`} icon={Target} variant="primary" />
        <StatCard title="Win Rate" value={loading ? "…" : `${kpis.winRate}%`} icon={TrendingUp} variant="warning" />
        <StatCard title="Active Deals" value={loading ? "…" : kpis.activeDeals} icon={Briefcase} />
      </div>

      {/* KPI row 2 — Sales & Billing */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Leads Generated" value={loading ? "…" : kpis.leadsGenerated} icon={Users} variant="primary" />
        <StatCard title="Conversion Rate" value={loading ? "…" : `${kpis.conversionRate}%`} icon={Percent} variant="success" />
        <StatCard title="Quotes" value={loading ? "…" : kpis.quotesTotal} icon={FileText} />
        <StatCard title="Invoices" value={loading ? "…" : kpis.invoicesTotal} icon={Receipt} />
      </div>

      {/* KPI row 3 — Billing & Customers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Paid Revenue" value={loading ? "…" : `$${(kpis.paidRevenue / 1000).toFixed(0)}k`} icon={DollarSign} variant="success" />
        <StatCard title="Outstanding" value={loading ? "…" : `$${(kpis.outstandingRevenue / 1000).toFixed(0)}k`} icon={Target} variant="warning" />
        <StatCard title="Overdue" value={loading ? "…" : `$${(kpis.overdueRevenue / 1000).toFixed(0)}k`} icon={Ticket} variant="danger" />
        <StatCard title="Customers" value={loading ? "…" : kpis.customersTotal} icon={Building2} />
      </div>

      {/* KPI row 4 — Velocity & Forecast (advanced_analytics) */}
      <FeatureGate feature="advanced_analytics" featureLabel="Advanced analytics" mode="hide">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Forecast (Committed)" value={loading ? "…" : `$${(data.forecast.totals.committed / 1000).toFixed(0)}k`} icon={CheckCircle2} variant="success" />
          <StatCard title="Forecast (Weighted)" value={loading ? "…" : `$${(data.forecast.totals.weighted / 1000).toFixed(0)}k`} icon={TrendingUp} variant="primary" />
          <StatCard title="Pipeline Velocity" value={loading ? "…" : `$${data.velocity.velocityPerDay.toLocaleString()}/day`} icon={Gauge} variant="warning" />
          <StatCard title="Avg Sales Cycle" value={loading ? "…" : `${data.velocity.avgCycleDays}d`} icon={CalendarClock} />
        </div>
      </FeatureGate>

      {/* Revenue & Pipeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Trend" subtitle="Won revenue by month" fullscreen onExport={exportReport}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Pipeline by Stage" subtitle="Opportunity value by stage" fullscreen onExport={exportReport}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={90} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Value">
                  {data.pipelineData.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Pipeline Analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Pipeline Funnel" subtitle="Opportunities by stage" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<ChartTooltip />} />
                <Funnel dataKey="count" data={data.funnelData} isAnimationActive>
                  {data.funnelData.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="stage" style={{ fontSize: 12 }} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Stage Conversion Rate" subtitle="% advancing to next stage" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stageConversionRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="conversionRate" fill={primary} radius={[3, 3, 0, 0]} name="Conversion" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Won vs Lost" subtitle="Closed opportunities" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data.wonVsLost} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {data.wonVsLost.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Lead Analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Lead Sources" subtitle="Distribution by channel" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data.leadSources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {data.leadSources.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Lead Conversion Funnel" subtitle="New → Contacted → Qualified → Converted" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<ChartTooltip />} />
                <Funnel dataKey="count" data={data.leadFunnel} isAnimationActive>
                  {data.leadFunnel.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="stage" style={{ fontSize: 12 }} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Leads by Status" subtitle="Current distribution" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.leadByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Revenue by customer/owner/company */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Revenue by Customer" subtitle="Top customers" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByCustomer} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={110} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 3, 3, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Owner" subtitle="Won revenue per owner" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByOwner} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill={primary} radius={[0, 3, 3, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue by Company" subtitle="Top companies" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByCompany} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={110} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 3, 3, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Quotes & Invoices */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Quotes by Status" subtitle="Quote distribution" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data.quotesByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {data.quotesByStatus.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Quote Value Trend" subtitle="Monthly quoted value" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.quoteTrend}>
                <defs>
                  <linearGradient id="quoteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#quoteGrad)" strokeWidth={2} name="Quoted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Invoices by Status" subtitle="Invoice distribution" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data.invoicesByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {data.invoicesByStatus.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Operations analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Payment Trend" subtitle="Paid revenue by month" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.paymentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" fill="#06b6d433" strokeWidth={2} name="Paid" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Activities Over Time" subtitle="Calls, emails, meetings & tasks" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activitiesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="calls" fill={primary} radius={[2, 2, 0, 0]} name="Calls" />
                <Bar dataKey="emails" fill="#10b981" radius={[2, 2, 0, 0]} name="Emails" />
                <Bar dataKey="meetings" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Meetings" />
                <Bar dataKey="tasks" fill="#8b5cf6" radius={[2, 2, 0, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Customers by Month" subtitle="New customers added" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.customersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#84cc16" radius={[3, 3, 0, 0]} name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Tickets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Tickets by Status" subtitle="Support ticket distribution" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data.ticketsByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {data.ticketsByStatus.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Average Days in Stage" subtitle="Time spent per pipeline stage" fullscreen>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.avgDaysInStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="days" fill="#ec4899" radius={[3, 3, 0, 0]} name="Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Revenue Forecast + Velocity + Win/Loss + Team + Health (advanced_analytics) */}
      <FeatureGate feature="advanced_analytics" featureLabel="Advanced analytics">
        {/* Revenue Forecast */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Revenue Forecast" subtitle="Committed / weighted / best case by close month" fullscreen onExport={() => downloadCsv("revenue-forecast.csv", [["Month", "Committed", "Weighted", "Best"], ...data.forecast.months.map((m) => [m.month, m.committed, m.weighted, m.best])])}>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-xs text-slate-500">Committed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-600" />
                <span className="text-xs text-slate-500">Weighted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-300" />
                <span className="text-xs text-slate-500">Best case</span>
              </div>
              <button
                onClick={() => drillTo("/opportunities?view=forecast")}
                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Open forecast view <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.forecast.months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="committed" stackId="a" fill="#10b981" name="Committed" />
                  <Bar dataKey="weighted" stackId="a" fill="#2563eb" name="Weighted" />
                  <Bar dataKey="best" fill="#cbd5e1" radius={[3, 3, 0, 0]} name="Best" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Pipeline Velocity" subtitle="Deals advanced into each stage this period" fullscreen onExport={() => downloadCsv("pipeline-velocity.csv", [["Stage", "Deals Moved"], ...data.velocity.dealsMovedByStage.map((m) => [m.stage, m.count])])}>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Velocity</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  ${data.velocity.velocityPerDay.toLocaleString()}/day
                </p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Avg cycle</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {data.velocity.avgCycleDays}d
                </p>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.velocity.dealsMovedByStage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill={primary} radius={[3, 3, 0, 0]} name="Deals moved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Win/Loss analytics */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="Won by Reason" subtitle="Why deals close" fullscreen onExport={() => downloadCsv("won-by-reason.csv", [["Reason", "Value", "Count"], ...data.winLoss.wonByReason.map((r) => [r.name, r.value, r.count])])}>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.winLoss.wonByReason} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={110} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 3, 3, 0]} name="Won value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => drillTo("/opportunities?view=list")}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              View pipeline <ArrowRight className="h-3 w-3" />
            </button>
          </ChartCard>

          <ChartCard title="Lost by Reason" subtitle="Why deals slip away" fullscreen onExport={() => downloadCsv("lost-by-reason.csv", [["Reason", "Value", "Count"], ...data.winLoss.lostByReason.map((r) => [r.name, r.value, r.count])])}>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.winLoss.lostByReason} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={110} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 3, 3, 0]} name="Lost value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => drillTo("/opportunities?view=list")}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              View pipeline <ArrowRight className="h-3 w-3" />
            </button>
          </ChartCard>

          <ChartCard title="Win Rate Trend" subtitle="Monthly close ratio" fullscreen>
            <div className="mb-4 flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                ${(data.winLoss.wonValue / 1000).toFixed(0)}k won
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                ${(data.winLoss.lostValue / 1000).toFixed(0)}k lost
              </span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.winLoss.winRateTrend}>
                  <defs>
                    <linearGradient id="winRateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="winRate" stroke="#10b981" fill="url(#winRateGrad)" strokeWidth={2} name="Win rate" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Team productivity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Team Productivity" subtitle="Won revenue by owner" fullscreen onExport={() => downloadCsv("team-productivity.csv", [["Owner", "Won Value", "Won", "Active", "Win Rate", "Tasks", "Meetings", "Calls", "Emails"], ...data.teamProductivity.map((t) => [t.name, t.wonValue, t.wonCount, t.activeDeals, `${t.winRate}%`, t.tasksCompleted, t.meetingsHeld, t.callsMade, t.emailsSent])])}>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.teamProductivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={110} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="wonValue" fill={primary} radius={[0, 3, 3, 0]} name="Won revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Activity Mix by Owner" subtitle="Completed work per teammate" fullscreen>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3 font-medium">Owner</th>
                    <th className="py-2 pr-3 text-right font-medium">Tasks</th>
                    <th className="py-2 pr-3 text-right font-medium">Meetings</th>
                    <th className="py-2 pr-3 text-right font-medium">Calls</th>
                    <th className="py-2 text-right font-medium">Emails</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teamProductivity.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">No activity data in this range.</td>
                    </tr>
                  )}
                  {data.teamProductivity.map((t) => (
                    <tr key={t.name} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-3 font-medium text-slate-700">{t.name}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-600">{t.tasksCompleted}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-600">{t.meetingsHeld}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-600">{t.callsMade}</td>
                      <td className="py-2 text-right tabular-nums text-slate-600">{t.emailsSent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>

        {/* Customer health */}
        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="Customer Health" subtitle="Health score across companies" fullscreen>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={data.customerHealth.distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {data.customerHealth.distribution.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.name === "Healthy" ? "#10b981" : entry.name === "At risk" ? "#f59e0b" : "#ef4444"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 py-2 dark:bg-emerald-900/30">
                <p className="text-lg font-bold text-emerald-600">{data.customerHealth.healthy}</p>
                <p className="text-[11px] text-slate-400">Healthy</p>
              </div>
              <div className="rounded-lg bg-amber-50 py-2 dark:bg-amber-900/30">
                <p className="text-lg font-bold text-amber-600">{data.customerHealth.atRisk}</p>
                <p className="text-[11px] text-slate-400">At risk</p>
              </div>
              <div className="rounded-lg bg-red-50 py-2 dark:bg-red-900/30">
                <p className="text-lg font-bold text-red-600">{data.customerHealth.needsAttention}</p>
                <p className="text-[11px] text-slate-400">Attention</p>
              </div>
            </div>
            <button
              onClick={() => drillTo("/companies")}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              View companies <ArrowRight className="h-3 w-3" />
            </button>
          </ChartCard>

          <ChartCard title="Top Companies by Health" subtitle="Best-scoring accounts" fullscreen className="lg:col-span-2">
            <div className="space-y-3">
              {data.customerHealth.topCompanies.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">No company data yet.</p>
              )}
              {data.customerHealth.topCompanies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => drillTo(`/companies/${c.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-slate-600"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                    <HeartPulse className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{c.name}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {c.industry || "—"} · ${(c.pipelineValue / 1000).toFixed(0)}k pipeline · ${(c.wonRevenue / 1000).toFixed(0)}k won
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium">{c.label}</span>
                    <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{c.score}</span>
                  </span>
                </button>
              ))}
            </div>
          </ChartCard>
        </div>
      </FeatureGate>
      </PageLayout>
    </FeatureGate>
  );
}
