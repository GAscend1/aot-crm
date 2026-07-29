"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText, HelpCircle, Video, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { cn } from "@/lib/utils"

const sections = [
  {
    title: "Getting Started Guides",
    description: "Step-by-step guides to set up your team, import your data, and start using AOT CRM productively.",
    icon: BookOpen,
    gradient: "from-blue-500 to-cyan-500",
    articles: [
      "Set up your workspace and invite your team",
      "Import contacts from Outlook and CSV files",
      "Create your first pipeline and add deals",
      "Connect Microsoft 365 integration",
    ],
  },
  {
    title: "Product Documentation",
    description: "Comprehensive guides, API references, configuration manuals, and integration docs.",
    icon: FileText,
    gradient: "from-purple-500 to-indigo-500",
    articles: [
      "API reference and webhook documentation",
      "Migration from other CRM platforms",
      "Workflow automation reference",
      "Security and compliance guide",
    ],
  },
  {
    title: "Help Center & FAQ",
    description: "Troubleshooting guides, account management, and answers to common questions.",
    icon: HelpCircle,
    gradient: "from-amber-500 to-orange-500",
    articles: [
      "Account setup and billing management",
      "Common troubleshooting steps",
      "Data export, backup, and restore",
      "Permission and role management",
    ],
  },
  {
    title: "Webinars & Product Demos",
    description: "Watch live and recorded sessions covering the latest features, best practices, and roadmap previews.",
    icon: Video,
    gradient: "from-emerald-500 to-teal-500",
    articles: [
      "Product roadmap and what is coming next",
      "Deep dive: workflow automation",
      "Customer success stories and case studies",
      "Security & compliance best practices",
    ],
  },
]

const quickLinks = [
  { label: "API Reference", href: "#" },
  { label: "Status Page", href: "#" },
  { label: "Release Notes", href: "#" },
  { label: "System Requirements", href: "#" },
  { label: "Glossary", href: "#" },
]

export default function ResourcesPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-20%] right-[-5%] size-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            Learn & Grow
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Resources</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to get the most out of AOT CRM.
          </p>
        </div>
      </section>

      <ScrollReveal>
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 sm:grid-cols-2">
              {sections.map((s) => {
                const Icon = s.icon
                return (
                  <Card key={s.title} className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardHeader>
                      <div className={cn("inline-flex rounded-lg bg-gradient-to-r p-0.5", s.gradient)}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background">
                          <Icon className="h-5 w-5 text-foreground" />
                        </div>
                      </div>
                      <CardTitle className="mt-3">{s.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {s.articles.map((a) => (
                          <li key={a}>
                            <Link href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                              <ArrowRight className="size-3 shrink-0 text-primary" />
                              {a}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold">Quick Links</h2>
                <p className="mt-2 text-sm text-muted-foreground">Commonly accessed resources.</p>
              </div>
              <div className="lg:col-span-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm transition-all hover:shadow-sm hover:-translate-y-0.5"
                    >
                      <Zap className="size-4 text-primary" />
                      {link.label}
                      <ArrowRight className="ml-auto size-3 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-3xl font-bold">Need help getting started?</h2>
            <p className="text-muted-foreground">Our team is ready to help you make the most of AOT CRM.</p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <Link href="/book-demo">Book Onboarding <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </MarketingLayout>
  )
}
