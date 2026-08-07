"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Shield, Mail, MessageSquare, Calendar, Database, HardDrive, BarChart3, Building2 } from "lucide-react"

interface IntegrationNode {
  id: string
  name: string
  icon: typeof Shield
  status: "available" | "admin-required" | "ready" | "configurable"
  x: number
  y: number
}

const integrations: IntegrationNode[] = [
  { id: "entra", name: "Entra ID", icon: Shield, status: "available", x: 50, y: 15 },
  { id: "outlook", name: "Outlook", icon: Mail, status: "admin-required", x: 20, y: 35 },
  { id: "teams", name: "Teams", icon: MessageSquare, status: "admin-required", x: 80, y: 35 },
  { id: "calendar", name: "Calendar", icon: Calendar, status: "ready", x: 15, y: 55 },
  { id: "onedrive", name: "OneDrive", icon: HardDrive, status: "ready", x: 85, y: 55 },
  { id: "azure-sql", name: "Azure SQL", icon: Database, status: "configurable", x: 35, y: 75 },
  { id: "powerbi", name: "Power BI", icon: BarChart3, status: "configurable", x: 65, y: 75 },
  { id: "dynamics", name: "Dynamics 365", icon: Building2, status: "configurable", x: 50, y: 90 },
]

const statusColors: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "admin-required": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ready: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  configurable: "bg-slate-500/10 text-slate-600 border-slate-500/20",
}

const statusLabels: Record<string, string> = {
  available: "Available",
  "admin-required": "Admin Approval",
  ready: "Ready",
  configurable: "Configurable",
}

export function MicrosoftEcosystem() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [activeIntegration, setActiveIntegration] = useState<string>("entra")
  const active = integrations.find(i => i.id === activeIntegration)

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-2 lg:col-span-2">
        <div className="flex flex-wrap gap-1.5">
          {integrations.map((integration) => {
            const Icon = integration.icon
            const isActive = activeIntegration === integration.id
            return (
              <button
                key={integration.id}
                onClick={() => setActiveIntegration(integration.id)}
                onMouseEnter={() => setHovered(integration.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs transition-all hover:shadow-sm",
                  isActive && "ring-2 ring-primary"
                )}
              >
                <div className="flex size-7 items-center justify-center rounded-md border bg-muted/50">
                  <Icon className="size-3.5" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{integration.name}</div>
                  <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-[9px]", statusColors[integration.status])}>
                    {statusLabels[integration.status]}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {active && (
          <div className="mt-4 rounded-lg border bg-muted/20 p-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <active.icon className="size-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{active.name}</div>
                <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-[9px]", statusColors[active.status])}>
                  {statusLabels[active.status]}
                </span>
              </div>
            </div>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {active.id === "entra" && "Enterprise-grade authentication and identity management with SSO, MFA, and conditional access policies."}
              {active.id === "outlook" && "Two-way email and calendar sync. Track, log, and respond to customer emails directly from AOT CRM."}
              {active.id === "teams" && "View CRM records, share updates, and launch collaboration without leaving Microsoft Teams."}
              {active.id === "calendar" && "Sync meetings and availability bidirectionally. Schedule from any CRM record."}
              {active.id === "onedrive" && "Store and share documents with Azure Blob Storage. Version control integrated."}
              {active.id === "azure-sql" && "Secure, scalable database backend for all CRM data with built-in replication."}
              {active.id === "powerbi" && "Export CRM analytics to Power BI for advanced reporting and visualization."}
              {active.id === "dynamics" && "Bring Dynamics 365 sales and service data into AOT CRM for a complete view of customer relationships."}
            </p>
          </div>
        )}
      </div>

      <div className="relative lg:col-span-3">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/20 transition-all duration-500",
              "ring-4 ring-blue-500/20"
            )}>
              <span className="text-xl font-bold">AOT</span>
            </div>
          </div>

          {integrations.map((integration) => {
            const Icon = integration.icon
            const angle = (parseInt(integration.id.length.toString()) * 45 + integrations.indexOf(integration) * 45) % 360
            const rad = (angle * Math.PI) / 180
            const radius = 38
            const x = 50 + radius * Math.cos(rad)
            const y = 50 + radius * Math.sin(rad)

            return (
              <button
                key={integration.id}
                onClick={() => setActiveIntegration(integration.id)}
                className={cn(
                  "absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 bg-card shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl",
                  hovered === integration.id && "scale-110 shadow-xl",
                  activeIntegration === integration.id ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
                style={{ left: `${x}%`, top: `${y}%` }}
                title={integration.name}
              >
                <Icon className="size-5" />
                <div className={cn(
                  "absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-medium text-muted-foreground transition-opacity",
                  hovered === integration.id || activeIntegration === integration.id ? "opacity-100" : "opacity-0"
                )}>
                  {integration.name}
                </div>
              </button>
            )
          })}

          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100">
            {integrations.map((integration) => {
              const angle = (parseInt(integration.id.length.toString()) * 45 + integrations.indexOf(integration) * 45) % 360
              const rad = (angle * Math.PI) / 180
              const radius = 38
              const x = 50 + radius * Math.cos(rad)
              const y = 50 + radius * Math.sin(rad)
              const isHighlighted = hovered === integration.id || activeIntegration === integration.id
              return (
                <line
                  key={integration.id}
                  x1="50" y1="50" x2={x} y2={y}
                  className={cn("transition-all", isHighlighted ? "stroke-primary/40" : "stroke-border")}
                  strokeWidth={isHighlighted ? "1.5" : "0.8"}
                  strokeDasharray="3 2"
                />
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
