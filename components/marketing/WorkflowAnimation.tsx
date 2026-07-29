"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { UserPlus, CheckCircle2, TrendingUp, Mail, Calendar, Bell, Users, Zap } from "lucide-react"

interface Step {
  id: string
  icon: typeof UserPlus
  label: string
  detail: string
}

const steps: Step[] = [
  { id: "lead", icon: UserPlus, label: "Lead Captured", detail: "New lead from website form" },
  { id: "qualified", icon: CheckCircle2, label: "Lead Qualified", detail: "Score passed threshold" },
  { id: "opportunity", icon: TrendingUp, label: "Opportunity Created", detail: "$84K deal opened" },
  { id: "email", icon: Mail, label: "Outlook Email Sent", detail: "Proposal delivered" },
  { id: "meeting", icon: Calendar, label: "Teams Meeting", detail: "Demo scheduled" },
  { id: "updated", icon: Bell, label: "Forecast Updated", detail: "Pipeline refreshed" },
  { id: "assigned", icon: Users, label: "Task Assigned", detail: "Follow-up created" },
  { id: "automated", icon: Zap, label: "Workflow Triggered", detail: "Sequence started" },
]

const totalDuration = 12000

export function WorkflowAnimation() {
  const [activeStep, setActiveStep] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = totalDuration / steps.length
    let stepIndex = 0

    const timer = setInterval(() => {
      stepIndex++
      if (stepIndex >= steps.length) {
        stepIndex = 0
      }
      setActiveStep(stepIndex)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <div ref={containerRef} className="rounded-xl border bg-card p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Lead-to-Revenue Workflow</h3>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Live Demo</span>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-0">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === activeStep
            const isPast = index < activeStep
            const isFuture = index > activeStep

            return (
              <div
                key={step.id}
                className={cn(
                  "relative flex items-start gap-4 py-3 transition-all duration-500",
                  isActive && "scale-[1.02]",
                  isFuture && "opacity-30"
                )}
              >
                <div
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-card transition-all duration-500",
                    isActive && "border-primary bg-primary/10 shadow-lg shadow-primary/20",
                    isPast && "border-emerald-500 bg-emerald-500/10",
                    isFuture && "border-border"
                  )}
                >
                  <Icon className={cn(
                    "size-3.5 transition-colors",
                    isActive && "text-primary",
                    isPast && "text-emerald-500",
                    isFuture && "text-muted-foreground/40"
                  )} />
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      isActive && "text-foreground",
                      isPast && "text-emerald-600",
                      isFuture && "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                    {isPast && <CheckCircle2 className="size-3 text-emerald-500" />}
                  </div>
                  <div className={cn(
                    "text-[11px] transition-colors",
                    isActive ? "text-foreground/80" : "text-muted-foreground/60"
                  )}>
                    {step.detail}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
