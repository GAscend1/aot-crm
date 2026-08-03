"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  const [filters, setFilters] = useState<ReportFilters>({ range: "year" });
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const { data, loading, refresh } = useReportsData(filters);
  const { palette, primary } = useChartPalette();

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

  const handleExport = () => {
    const summary = [
      "Sales Analytics Export",
      `Range: ${appliedFilters.join(", ") || "Current Year"}`,
      "",
      "KPI,Value",
      `Revenue,${kpis.revenue}`,
      `Pipeline Value,${kpis.pipelineValue}`,
      `Win Rate,${kpis.winRate}%`,
      `Active Deals,${kpis.activeDeals}`,
      `Leads Generated,${kpis.leadsGenerated}`,
      `Conversion Rate,${kpis.conversionRate}%`,
      `Quotes,${kpis.quotesTotal}`,
      `Invoices,${kpis.invoicesTotal}`,
      `Paid Revenue,${kpis.paidRevenue}`,
      `Outstanding,${kpis.outstandingRevenue}`,
      `Overdue,${kpis.overdueRevenue}`,
    ].join("\n");
    const blob = new Blob([summary], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageLayout
      title="Sales Analytics"
      description="Enterprise business intelligence across the entire sales workflow."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
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

      {/* Revenue & Pipeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Trend" subtitle="Won revenue by month" fullscreen onExport={handleExport}>
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

        <ChartCard title="Pipeline by Stage" subtitle="Opportunity value by stage" fullscreen onExport={handleExport}>
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
    </PageLayout>
  );
}
