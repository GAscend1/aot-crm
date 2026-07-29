"use client"

import { Button } from "@/components/ui/button"
import { Building2, Store, Users, Target, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { cn } from "@/lib/utils"

const solutions = [
  {
    title: "Small Business",
    subtitle: "Grow smarter, not harder",
    description: "Affordable CRM tools tailored for small teams. Manage leads, track communications, and close deals faster without enterprise complexity.",
    icon: Store,
    gradient: "from-blue-500 to-cyan-500",
    benefits: ["Lead & contact management", "Pipeline tracking", "Email integration", "Reporting dashboard", "Up to 10 users"],
  },
  {
    title: "Enterprise",
    subtitle: "Scale with confidence",
    description: "Full-featured CRM with advanced security, compliance, and Microsoft 365 integration for large organizations.",
    icon: Building2,
    gradient: "from-purple-500 to-indigo-500",
    benefits: ["Azure-hosted infrastructure", "Microsoft Entra SSO", "Advanced automation", "Audit logs & compliance", "Unlimited users"],
  },
  {
    title: "Sales Teams",
    subtitle: "Close more deals",
    description: "Equip your sales team with pipeline visibility, automated follow-ups, and real-time collaboration tools.",
    icon: Target,
    gradient: "from-emerald-500 to-teal-500",
    benefits: ["Visual sales pipeline", "Automated sequences", "Meeting scheduling", "Activity tracking", "Mobile access"],
  },
  {
    title: "Customer Success",
    subtitle: "Delight at every touchpoint",
    description: "Proactive account management with 360-degree customer views, automated health scoring, and timely engagement.",
    icon: Users,
    gradient: "from-amber-500 to-orange-500",
    benefits: ["Customer 360 profiles", "Health scoring", "Automated check-ins", "Support ticket tracking", "NPS & satisfaction surveys"],
  },
]

export default function SolutionsPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-20%] right-[-5%] size-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            Use Cases
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Solutions for every team</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Whether you are a five-person team or a global enterprise, AOT CRM adapts to your workflow.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 space-y-16">
          {solutions.map((s, i) => {
            const Icon = s.icon
            return (
              <ScrollReveal key={s.title} delay={i * 100}>
                <div className="grid gap-8 lg:grid-cols-2 items-center">
                  <div className={cn("space-y-4", i % 2 === 1 && "lg:order-2")}>
                    <div className={cn("inline-flex rounded-lg bg-gradient-to-r p-0.5", s.gradient)}>
                      <div className="flex items-center gap-2 rounded-md bg-background px-3 py-1">
                        <Icon className="h-4 w-4 text-foreground" />
                        <span className="text-xs font-medium text-foreground">{s.subtitle}</span>
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold">{s.title}</h2>
                    <p className="text-muted-foreground">{s.description}</p>
                    <ul className="space-y-2">
                      {s.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={cn("flex justify-center", i % 2 === 1 && "lg:order-1")}>
                    <div className={cn(
                      "relative h-64 w-64 rounded-2xl bg-gradient-to-br p-6 border border-white/10",
                      s.gradient.includes("blue") ? "from-blue-500/10 to-cyan-500/10" :
                      s.gradient.includes("purple") ? "from-purple-500/10 to-indigo-500/10" :
                      s.gradient.includes("emerald") ? "from-emerald-500/10 to-teal-500/10" :
                      "from-amber-500/10 to-orange-500/10"
                    )}>
                      <Icon className="h-24 w-24 text-foreground/10 absolute bottom-4 right-4" />
                      <div className="space-y-3">
                        <div className="h-2 w-24 rounded-full bg-foreground/10" />
                        <div className="h-2 w-32 rounded-full bg-foreground/5" />
                        <div className="h-2 w-20 rounded-full bg-foreground/5" />
                        <div className="mt-6 grid grid-cols-2 gap-2">
                          <div className="h-12 rounded-lg bg-foreground/5 border border-foreground/5" />
                          <div className="h-12 rounded-lg bg-foreground/5 border border-foreground/5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </section>

      <ScrollReveal>
        <section className="bg-muted/50 py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-3xl font-bold">Not sure which solution fits?</h2>
            <p className="text-muted-foreground">Talk to our team for a personalized recommendation.</p>
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
