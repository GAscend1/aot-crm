"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { demoMetrics } from "@/lib/demo-data"
import { TrendingUp, BarChart3, LineChart } from "lucide-react"

const chartViews = [
  { id: "revenue", label: "Revenue", icon: TrendingUp },
  { id: "conversion", label: "Conversion", icon: BarChart3 },
  { id: "activity", label: "Activity", icon: LineChart },
] as const

const monthlyRevenue = [
  { month: "Jan", value: 240, forecast: 220 },
  { month: "Feb", value: 280, forecast: 260 },
  { month: "Mar", value: 320, forecast: 310 },
  { month: "Apr", value: 290, forecast: 300 },
  { month: "May", value: 380, forecast: 340 },
  { month: "Jun", value: 434, forecast: 400 },
]

const conversionData = [
  { stage: "Lead → MQL", rate: 68, avg: 52 },
  { stage: "MQL → SQL", rate: 54, avg: 38 },
  { stage: "SQL → Opp", rate: 72, avg: 58 },
  { stage: "Opp → Won", rate: 38, avg: 28 },
]

const activityData = [
  { day: "Mon", emails: 24, calls: 8, meetings: 3 },
  { day: "Tue", emails: 18, calls: 12, meetings: 5 },
  { day: "Wed", emails: 32, calls: 6, meetings: 4 },
  { day: "Thu", emails: 21, calls: 14, meetings: 6 },
  { day: "Fri", emails: 15, calls: 9, meetings: 3 },
]

function RevenueChart() {
  const maxVal = Math.max(...monthlyRevenue.map(r => Math.max(r.value, r.forecast)))
  const chartH = 160
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium">Revenue vs Forecast ($K)</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px]">
            <div className="size-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <div className="size-2 rounded-full bg-cyan-300" />
            <span className="text-muted-foreground">Forecast</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${monthlyRevenue.length * 60} ${chartH}`} className="w-full" style={{ height: chartH }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.546_0.245_262.881)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="oklch(0.546_0.245_262.881)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {monthlyRevenue.map((r, i) => {
          const x = i * 60 + 10
          const barW = 18
          const h1 = (r.value / maxVal) * (chartH - 20)
          const h2 = (r.forecast / maxVal) * (chartH - 20)
          return (
            <g key={r.month}>
              <rect x={x - barW / 2} y={chartH - 10 - h1} width={barW} height={h1} rx={3} className="fill-blue-500" />
              <rect x={x + 4} y={chartH - 10 - h2} width={barW} height={h2} rx={3} className="fill-cyan-300/60" />
              <text x={x} y={chartH - 2} textAnchor="middle" className="fill-muted-foreground" fontSize="8">{r.month}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ConversionChart() {
  const maxRate = 100
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-medium">Conversion Rates</span>
      <div className="space-y-2">
        {conversionData.map((c) => (
          <div key={c.stage} className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{c.stage}</span>
              <span className="font-medium">{c.rate}%</span>
            </div>
            <div className="relative h-3 rounded-sm bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-muted-foreground/20"
                style={{ width: `${(c.avg / maxRate) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${(c.rate / maxRate) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityChart() {
  const maxCalls = Math.max(...activityData.map(a => a.calls + a.meetings))
  const maxEmails = Math.max(...activityData.map(a => a.emails))
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-medium">Weekly Activity</span>
      <svg viewBox="0 0 250 100" className="w-full" style={{ height: 100 }}>
        {activityData.map((a, i) => {
          const x = i * 50 + 25
          const emailH = (a.emails / maxEmails) * 60
          const callsH = (a.calls / maxCalls) * 40
          return (
            <g key={a.day}>
              <rect x={x - 12} y={75 - emailH} width={10} height={emailH} rx={2} className="fill-blue-500" />
              <rect x={x + 2} y={75 - callsH} width={10} height={callsH} rx={2} className="fill-cyan-500" />
              <text x={x} y={92} textAnchor="middle" className="fill-muted-foreground" fontSize="7">{a.day}</text>
            </g>
          )
        })}
        <text x={5} y={10} className="fill-muted-foreground" fontSize="6">Emails</text>
        <text x={5} y={20} className="fill-muted-foreground" fontSize="6">Calls</text>
      </svg>
    </div>
  )
}

export function AnalyticsDemo() {
  const [chartView, setChartView] = useState("revenue")

  return (
    <div className="rounded-xl border bg-card p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Analytics Dashboard</h3>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          {chartViews.map((v) => {
            const Icon = v.icon
            return (
              <button
                key={v.id}
                onClick={() => setChartView(v.id)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                  chartView === v.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-2.5 text-xs">
          <div className="text-muted-foreground/60">Pipeline</div>
          <div className="text-base font-bold">${(demoMetrics.pipelineValue / 1000000).toFixed(1)}M</div>
          <div className="flex items-center gap-0.5 text-[10px] text-emerald-600">
            <TrendingUp className="size-3" /> +{demoMetrics.pipelineTrend}%
          </div>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-xs">
          <div className="text-muted-foreground/60">Win Rate</div>
          <div className="text-base font-bold">{demoMetrics.winRate}%</div>
          <div className="flex items-center gap-0.5 text-[10px] text-emerald-600">
            <TrendingUp className="size-3" /> +{demoMetrics.winRateTrend}%
          </div>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-xs">
          <div className="text-muted-foreground/60">Velocity</div>
          <div className="text-base font-bold">${demoMetrics.salesVelocity}K</div>
          <div className="flex items-center gap-0.5 text-[10px] text-emerald-600">
            <TrendingUp className="size-3" /> +{demoMetrics.velocityTrend}%
          </div>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-xs">
          <div className="text-muted-foreground/60">Meetings</div>
          <div className="text-base font-bold">{demoMetrics.meetingsThisWeek}</div>
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">this week</div>
        </div>
      </div>

      <div className="mt-4">
        {chartView === "revenue" && <RevenueChart />}
        {chartView === "conversion" && <ConversionChart />}
        {chartView === "activity" && <ActivityChart />}
      </div>
    </div>
  )
}
