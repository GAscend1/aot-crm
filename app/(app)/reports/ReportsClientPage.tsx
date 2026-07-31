"use client";

import { useEffect, useState } from "react";
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
  Download,
} from "lucide-react";

import { PageLayout } from "@/components/common/PageLayout";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { Button } from "@/components/ui/button";
import { useReportsData } from "@/hooks/use-reports-data";

import {
  Line,
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
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const emptyMonthly = MONTHS.map((month) => ({
  month,
  revenue: 0,
  target: 0,
  calls: 0,
  emails: 0,
  meetings: 0,
}));

interface ChartTooltipPayloadEntry {
  name: string;
  value: number | string;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadEntry[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
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
  const data = useReportsData();
  const [monthlyData, setMonthlyData] = useState(emptyMonthly);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [revRes, actRes] = await Promise.all([
          fetch("/api/dashboard/revenue"),
          fetch("/api/activities?pageSize=1000"),
        ]);
        const revJson = revRes.ok ? await revRes.json() : { monthlyRevenue: [] };
        const actJson = actRes.ok ? await actRes.json() : { data: [] };
        if (cancelled) return;

        const revenueRows = Array.isArray(revJson.monthlyRevenue) ? revJson.monthlyRevenue : [];
        const activities = Array.isArray(actJson.data) ? actJson.data : [];

        const series = MONTHS.map((month, i) => {
          const monthNum = i + 1;
          const revenueRow = revenueRows.find(
            (m: { month: string }) => m.month === month
          );
          const monthActivities = activities.filter(
            (a: { date: string }) => {
              const mm = parseInt(a.date?.slice(5, 7), 10);
              return mm === monthNum;
            }
          );
          return {
            month,
            revenue: revenueRow?.revenue ?? 0,
            target: revenueRow?.target ?? 0,
            calls: monthActivities.filter((a: { type: string }) => a.type === "Call").length,
            emails: monthActivities.filter((a: { type: string }) => a.type === "Email").length,
            meetings: monthActivities.filter((a: { type: string }) => a.type === "Meeting").length,
          };
        });
        setMonthlyData(series);
      } catch {
        // Keep zero-series fallback on failure
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageLayout
      title="Analytics Dashboard"
      description="Enterprise business intelligence and performance metrics."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/reports/manage">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Manage Reports
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={`$${(data.revenue / 1000).toFixed(0)}k`}
          icon={DollarSign}
          trend={{ value: "+12.5%", positive: true }}
          variant="primary"
        />
        <StatCard
          title="Pipeline Value"
          value={`$${(data.pipelineValue / 1000).toFixed(0)}k`}
          icon={Target}
          trend={{ value: "+8.3%", positive: true }}
          variant="success"
        />
        <StatCard
          title="Win Rate"
          value={`${data.winRate}%`}
          icon={TrendingUp}
          trend={{ value: "+5.2%", positive: true }}
          variant="warning"
        />
        <StatCard
          title="Active Deals"
          value={String(data.activeDeals)}
          icon={Briefcase}
          trend={{ value: "+3.1%", positive: true }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Leads Generated"
          value={String(data.leadsGenerated)}
          icon={Users}
          trend={{ value: "+18.2%", positive: true }}
          variant="primary"
        />
        <StatCard
          title="Conversion Rate"
          value={`${data.conversionRate}%`}
          icon={Target}
          trend={{ value: "+2.1%", positive: true }}
          variant="success"
        />
        <StatCard
          title="Customers"
          value={String(data.customersTotal)}
          icon={Building2}
          trend={{ value: "+7.8%", positive: true }}
        />
        <StatCard
          title="Tickets"
          value={String(data.ticketsTotal)}
          icon={Ticket}
          trend={{ value: "-5.3%", positive: false }}
          variant="danger"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Trend" subtitle="Monthly revenue vs target" fullscreen onExport={() => {}}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} name="Target" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Sales Pipeline" subtitle="Deal value by stage" fullscreen onExport={() => {}}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Value">
                  {data.pipelineData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Lead Sources" subtitle="Distribution by channel" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data.leadSources} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {data.leadSources.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Monthly Activities" subtitle="Calls, emails & meetings" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="calls" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Calls" />
                <Bar dataKey="emails" fill="#10b981" radius={[2, 2, 0, 0]} name="Emails" />
                <Bar dataKey="meetings" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Meetings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top Customers" subtitle="By revenue" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </PageLayout>
  );
}
