"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  PieChart,
  Activity,
  Ticket,
  Briefcase,
  Building2,
  FileText,
  ArrowUpRight,
  Download,
} from "lucide-react";

import { PageLayout } from "@/components/common/PageLayout";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { Button } from "@/components/ui/button";

import {
  LineChart,
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

const monthlyRevenue = [
  { month: "Jan", revenue: 42000, target: 40000, deals: 12 },
  { month: "Feb", revenue: 38000, target: 40000, deals: 10 },
  { month: "Mar", revenue: 45000, target: 42000, deals: 14 },
  { month: "Apr", revenue: 52000, target: 45000, deals: 16 },
  { month: "May", revenue: 48000, target: 48000, deals: 13 },
  { month: "Jun", revenue: 56000, target: 50000, deals: 18 },
  { month: "Jul", revenue: 61000, target: 55000, deals: 20 },
];

const pipelineData = [
  { stage: "Qualification", value: 120000, count: 24 },
  { stage: "Discovery", value: 180000, count: 18 },
  { stage: "Proposal", value: 250000, count: 12 },
  { stage: "Negotiation", value: 320000, count: 8 },
  { stage: "Closing", value: 180000, count: 5 },
];

const leadSources = [
  { name: "Website", value: 35 },
  { name: "Referral", value: 25 },
  { name: "Email", value: 20 },
  { name: "Social", value: 12 },
  { name: "Other", value: 8 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const monthlyActivities = [
  { month: "Jan", calls: 45, emails: 120, meetings: 18 },
  { month: "Feb", calls: 52, emails: 135, meetings: 22 },
  { month: "Mar", calls: 48, emails: 142, meetings: 20 },
  { month: "Apr", calls: 55, emails: 158, meetings: 25 },
  { month: "May", calls: 60, emails: 165, meetings: 28 },
  { month: "Jun", calls: 58, emails: 172, meetings: 30 },
  { month: "Jul", calls: 62, emails: 180, meetings: 32 },
];

const topCustomers = [
  { name: "Acme Corp", revenue: 45000, deals: 3 },
  { name: "Globex Inc", revenue: 38000, deals: 2 },
  { name: "Initech", revenue: 32000, deals: 4 },
  { name: "Umbrella Co", revenue: 28000, deals: 2 },
  { name: "Cyberdyne", revenue: 25000, deals: 1 },
  { name: "Wonka Ind", revenue: 22000, deals: 3 },
];

const teamPerformance = [
  { name: "Sarah J", deals: 12, revenue: 84000, winRate: 75 },
  { name: "Michael C", deals: 10, revenue: 72000, winRate: 68 },
  { name: "Emily R", deals: 8, revenue: 65000, winRate: 72 },
  { name: "Alex T", deals: 7, revenue: 54000, winRate: 65 },
  { name: "Lisa P", deals: 9, revenue: 61000, winRate: 70 },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-slate-900 dark:border-slate-700">
      <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
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
          value="$342,000"
          icon={DollarSign}
          trend={{ value: "+12.5%", positive: true }}
          variant="primary"
        />
        <StatCard
          title="Pipeline Value"
          value="$1,050,000"
          icon={Target}
          trend={{ value: "+8.3%", positive: true }}
          variant="success"
        />
        <StatCard
          title="Win Rate"
          value="72%"
          icon={TrendingUp}
          trend={{ value: "+5.2%", positive: true }}
          variant="warning"
        />
        <StatCard
          title="Active Deals"
          value="67"
          icon={Briefcase}
          trend={{ value: "+3.1%", positive: true }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Leads Generated"
          value="1,245"
          icon={Users}
          trend={{ value: "+18.2%", positive: true }}
          variant="primary"
        />
        <StatCard
          title="Conversion Rate"
          value="24%"
          icon={Target}
          trend={{ value: "+2.1%", positive: true }}
          variant="success"
        />
        <StatCard
          title="Customers"
          value="486"
          icon={Building2}
          trend={{ value: "+7.8%", positive: true }}
        />
        <StatCard
          title="Tickets"
          value="89"
          icon={Ticket}
          trend={{ value: "-5.3%", positive: false }}
          variant="danger"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue Trend" subtitle="Monthly revenue vs target" fullscreen onExport={() => {}}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
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
              <BarChart data={pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Value">
                  {pipelineData.map((_, i) => (
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
                <Pie data={leadSources} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {leadSources.map((_, i) => (
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
              <BarChart data={monthlyActivities}>
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

        <ChartCard title="Team Performance" subtitle="Deals closed this quarter" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="deals" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top Customers" subtitle="By revenue" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Win Rate by Team Member" subtitle="Percentage of deals won" fullscreen>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="winRate" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Win Rate">
                  {teamPerformance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </PageLayout>
  );
}
