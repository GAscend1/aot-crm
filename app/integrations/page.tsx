"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Shield, Mail, MessageSquare, Database, HardDrive, ArrowRight, BarChart3 } from "lucide-react"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { MicrosoftEcosystem } from "@/components/marketing/MicrosoftEcosystem"

const integrations = [
  { name: "Microsoft Entra ID", description: "Enterprise-grade authentication and identity management.", icon: Shield, status: "available" as const },
  { name: "Outlook", description: "Email, calendar, and contact sync with Microsoft 365.", icon: Mail, status: "admin-required" as const },
  { name: "Teams", description: "Collaborate on CRM records directly within Microsoft Teams.", icon: MessageSquare, status: "admin-required" as const },
  { name: "Azure SQL", description: "Secure, scalable database for CRM data storage.", icon: Database, status: "ready" as const },
  { name: "Azure Blob", description: "Document and file storage with Azure Blob Storage.", icon: HardDrive, status: "ready" as const },
  { name: "Power BI", description: "Export analytics to Power BI for advanced visualization.", icon: BarChart3, status: "ready" as const },
]

function StatusBadge({ status }: { status: "available" | "admin-required" | "ready" }) {
  const styles = {
    available: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "admin-required": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    ready: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  }
  const labels = {
    available: "Available",
    "admin-required": "Requires Admin Approval",
    ready: "Ready to Connect",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  )
}

export default function IntegrationsPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-10%] left-[-5%] size-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] size-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            Ecosystem
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Integrations</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect AOT CRM with the tools your team already uses every day.
          </p>
        </div>
      </section>

      <ScrollReveal>
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4">
            <MicrosoftEcosystem />
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold mb-10">Integration Directory</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {integrations.map((i) => {
                const Icon = i.icon
                return (
                  <Card key={i.name} className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <StatusBadge status={i.status} />
                      </div>
                      <CardTitle className="mt-3">{i.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{i.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-3xl font-bold">Need a custom integration?</h2>
            <p className="text-muted-foreground">Our API and webhook support make it easy to connect any system.</p>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Sales <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>
    </MarketingLayout>
  )
}
