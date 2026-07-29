"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { demoOpportunities, demoPipelineStages } from "@/lib/demo-data"
import { GripVertical, DollarSign, Clock, User, TrendingUp } from "lucide-react"

export function PipelineDemo() {
  const [selectedDeal, setSelectedDeal] = useState(demoOpportunities[0].id)

  const stages = demoPipelineStages.filter(s => s.id !== "closed-lost")
  const pipelineDeals = stages.map(stage => ({
    ...stage,
    deals: demoOpportunities.filter(o => o.stage === stage.id),
  }))

  const activeDeal = demoOpportunities.find(d => d.id === selectedDeal)

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 min-w-[600px]">
          {pipelineDeals.map(({ id, name, color, deals }) => {
            const stageTotal = deals.reduce((s, d) => s + d.value, 0)
            return (
              <div key={id} className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("size-2.5 rounded-full", color)} />
                    <span className="text-xs font-semibold">{name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{deals.length}</span>
                    <span>${(stageTotal / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                {deals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal.id)}
                    className={cn(
                      "w-full rounded-lg border bg-card p-2.5 text-left text-xs transition-all hover:shadow-md",
                      selectedDeal === deal.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-medium truncate">{deal.name}</span>
                      <GripVertical className="size-3 shrink-0 text-muted-foreground/30" />
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="size-3" />
                      <span>{deal.value.toLocaleString()}</span>
                    </div>
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                        <span>{deal.probability}%</span>
                        <span>{deal.owner}</span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", deal.probability >= 75 ? "bg-emerald-500" : deal.probability >= 40 ? "bg-cyan-500" : "bg-blue-500")}
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {activeDeal && (
        <div className="w-full shrink-0 rounded-xl border bg-card p-5 lg:w-72">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{activeDeal.name}</h4>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              activeDeal.stage === "closed-won" ? "bg-emerald-500/10 text-emerald-600" :
              activeDeal.stage === "negotiation" ? "bg-cyan-500/10 text-cyan-600" :
              "bg-blue-500/10 text-blue-600"
            )}>
              {demoPipelineStages.find(s => s.id === activeDeal.stage)?.name}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="size-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Deal Value</div>
                <div className="font-semibold">${activeDeal.value.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <TrendingUp className="size-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Probability</div>
                <div className="font-semibold">{activeDeal.probability}%</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="size-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Owner</div>
                <div className="font-semibold">{activeDeal.owner}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Days Active</div>
                <div className="font-semibold">{5 + (activeDeal.value % 25)}d</div>
              </div>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", activeDeal.probability >= 75 ? "bg-emerald-500" : activeDeal.probability >= 40 ? "bg-cyan-500" : "bg-blue-500")}
              style={{ width: `${activeDeal.probability}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
