"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users, GitBranch, BarChart3, Mail, Calendar, MessageSquare,
  Video, FileText, Settings, Activity, Key, ArrowRight
} from "lucide-react"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { cn } from "@/lib/utils"

const features = [
  { title: "Lead Management", description: "Capture, qualify, and nurture leads through every stage of the sales funnel with automated scoring and routing.", icon: Users },
  { title: "Contact Management", description: "360-degree customer profiles with communication history, engagement tracking, and relationship mapping.", icon: Users },
  { title: "Pipeline Management", description: "Visual sales pipeline with drag-and-drop deal tracking, stage forecasting, and revenue insights.", icon: GitBranch },
  { title: "Reporting & Analytics", description: "Custom dashboards and real-time reports powered by Azure data services for actionable insights.", icon: BarChart3 },
  { title: "Email Integration", description: "Connect Outlook mail and calendar for seamless email tracking, templates, and automated sequences.", icon: Mail },
  { title: "Calendar Sync", description: "Two-way calendar sync with Outlook to manage meetings, follow-ups, and availability across the team.", icon: Calendar },
  { title: "Teams Integration", description: "Collaborate on records, share updates, and join meetings directly from Microsoft Teams.", icon: MessageSquare },
  { title: "Zoom Integration", description: "Schedule, join, and log Zoom meetings linked to contacts, leads, and opportunities.", icon: Video },
  { title: "Document Management", description: "Store, share, and collaborate on documents with version control and Azure Blob integration.", icon: FileText },
  { title: "Automation", description: "Build workflows to automate repetitive tasks, email sequences, and data enrichment rules.", icon: Settings },
  { title: "Audit Logs", description: "Full audit trail of every action, change, and access event for compliance and security review.", icon: Activity },
  { title: "API Access", description: "Extend and integrate AOT CRM with any system through our REST API and webhook support.", icon: Key },
]

export default function FeaturesPageClient() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-[-10%] size-[500px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            Everything you need
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">All the tools to grow smarter</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From first touch to loyal customer, AOT CRM gives your team everything needed to build lasting relationships.
          </p>
        </div>
      </section>

      <ScrollReveal>
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon
                const isHovered = hoveredCard === f.title
                return (
                  <Card
                    key={f.title}
                    className="group transition-all duration-300 hover:-translate-y-1"
                    onMouseEnter={() => setHoveredCard(f.title)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <CardHeader>
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300",
                        isHovered && "bg-primary/20 scale-110"
                      )}>
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="mt-3">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="bg-muted/50 py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-3xl font-bold">Ready to see it in action?</h2>
            <p className="text-muted-foreground">Book a personalized demo with our team.</p>
            <Button size="lg" asChild>
              <Link href="/book-demo">
                Book a Demo <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </ScrollReveal>
    </MarketingLayout>
  )
}
