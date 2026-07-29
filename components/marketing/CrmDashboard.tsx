"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { demoPipelineStages, demoOpportunities, demoActivities, demoMetrics, demoUser } from "@/lib/demo-data"
import { CheckCircle2, ArrowUp, ArrowDown, Clock, BarChart3, TrendingUp, Users } from "lucide-react"

function MetricCard({ label, value, trend, icon: Icon }: { label: string; value: string; trend: string; icon: typeof BarChart3 }) {
  const isPositive = !trend.startsWith("-")
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <Icon className="size-3.5 text-muted-foreground/60" />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold">{value}</span>
        <span className={cn("flex items-center gap-0.5 text-[11px]", isPositive ? "text-emerald-600" : "text-red-500")}>
          {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {trend}
        </span>
      </div>
    </div>
  )
}

function PipelineColumn({ stage, deals }: { stage: string; deals: typeof demoOpportunities }) {
  const colors: Record<string, string> = {
    discovery: "bg-slate-500",
    qualifying: "bg-blue-500",
    proposal: "bg-indigo-500",
    negotiation: "bg-cyan-500",
    "closed-won": "bg-emerald-500",
    "closed-lost": "bg-rose-500",
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className={cn("size-2 rounded-full", colors[stage] || "bg-slate-400")} />
          <span className="text-[11px] font-medium">{demoPipelineStages.find(s => s.id === stage)?.name || stage}</span>
        </div>
        <span className="text-[11px] text-muted-foreground">{deals.length}</span>
      </div>
      {deals.map((deal) => (
        <div key={deal.id} className="rounded-lg border bg-card p-2 text-[11px] transition-shadow hover:shadow-sm">
          <div className="font-medium truncate">{deal.name}</div>
          <div className="mt-0.5 text-muted-foreground">
            ${deal.value.toLocaleString()} &middot; {deal.probability}%
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground/60">{deal.owner.split(" ").map(n => n[0]).join("")}</span>
            <div className="flex items-center gap-1">
              <Clock className="size-2.5 text-muted-foreground/40" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivityItem({ activity }: { activity: typeof demoActivities[number] }) {
  const typeStyles: Record<string, string> = {
    email: "text-blue-500",
    meeting: "text-cyan-500",
    note: "text-amber-500",
    task: "text-violet-500",
    call: "text-emerald-500",
  }
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <div className={cn("mt-0.5 size-2 rounded-full shrink-0", typeStyles[activity.type] || "bg-muted-foreground")} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium truncate">{activity.subject}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground/60">{activity.time}</span>
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {activity.contact} &middot; {activity.company}
        </div>
      </div>
    </div>
  )
}

interface CrmDashboardProps {
  className?: string
  floating?: boolean
}

export function CrmDashboard({ className, floating }: CrmDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "pipeline" | "activity">("overview")

  const stages = ["discovery", "qualifying", "proposal", "negotiation", "closed-won"]
  const pipelineDeals = stages.map(stage => ({
    stage,
    deals: demoOpportunities.filter(o => o.stage === stage),
  }))

  return (
    <div className={cn(
      "rounded-xl border bg-card shadow-lg ring-1 ring-foreground/5 overflow-hidden",
      floating && "animate-float",
      className
    )}>
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">A</div>
          <span className="text-xs font-semibold">AOT CRM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
            <div className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">{demoUser.name}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-0 border-b bg-muted/20 px-4">
        {(["overview", "pipeline", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-2 text-[11px] font-medium border-b-2 transition-colors capitalize",
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MetricCard label="Pipeline Value" value={`$${(demoMetrics.pipelineValue / 1000000).toFixed(1)}M`} trend={`+${demoMetrics.pipelineTrend}%`} icon={TrendingUp} />
              <MetricCard label="Won This Quarter" value={`$${(demoMetrics.wonThisQuarter / 1000).toFixed(0)}K`} trend={`+${demoMetrics.wonTrend}%`} icon={BarChart3} />
              <MetricCard label="Win Rate" value={`${demoMetrics.winRate}%`} trend={`+${demoMetrics.winRateTrend}%`} icon={Users} />
              <MetricCard label="Active Deals" value={`${demoMetrics.activeDeals}`} trend={`+${demoMetrics.activeTrend}`} icon={BarChart3} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Pipeline by Stage</span>
                <span className="text-[10px] text-muted-foreground/60">{demoOpportunities.length} deals</span>
              </div>
              <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
                {pipelineDeals.map(({ stage, deals }) => {
                  const pct = (deals.length / demoOpportunities.length) * 100
                  return (
                    <div
                      key={stage}
                      className={cn("h-full transition-all", stage === "closed-won" ? "bg-emerald-500" : stage === "negotiation" ? "bg-cyan-500" : stage === "proposal" ? "bg-indigo-500" : stage === "qualifying" ? "bg-blue-500" : "bg-slate-400")}
                      style={{ width: `${pct}%` }}
                    />
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium">Revenue Forecast</span>
                <span className="text-[11px] text-muted-foreground">Q3 2026</span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold">$1.2M</span>
                  <span className="text-[11px] text-emerald-600">68% of quota</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border bg-card p-2.5">
                <div className="text-muted-foreground/60">Avg Deal Size</div>
                <div className="mt-0.5 font-semibold">${demoMetrics.avgDealSize.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border bg-card p-2.5">
                <div className="text-muted-foreground/60">Sales Velocity</div>
                <div className="mt-0.5 font-semibold">${demoMetrics.salesVelocity}K/mo</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="grid grid-cols-5 gap-2">
            {pipelineDeals.map(({ stage, deals }) => (
              <PipelineColumn key={stage} stage={stage} deals={deals} />
            ))}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">Recent Activity</span>
              <CheckCircle2 className="size-3 text-emerald-500" />
            </div>
            <div className="divide-y">
              {demoActivities.slice(0, 6).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
