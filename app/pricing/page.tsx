"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Info } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { FAQSection } from "@/components/marketing/FAQSection"

/**
 * Public pricing — reflects the final plan matrix (lib/entitlements.ts).
 *
 * - TRIAL is NOT sold as a tier: every new workspace starts with a 7-day
 *   full-feature trial. Only STARTER / PROFESSIONAL / ENTERPRISE are listed.
 * - Feature lists are accurate: Professional deliberately does NOT advertise
 *   Calendar Sync, Teams or Zoom; those are Enterprise-only capabilities.
 * - Microsoft 365 / Teams / Zoom capabilities are only unlocked by Enterprise
 *   AND require the customer's own provider connection (technical
 *   configuration is never implied by the plan alone).
 */
const tiers = [
  {
    name: "Starter",
    price: "Contact Sales",
    period: "per user / month",
    description: "Core CRM for teams getting started.",
    features: [
      "Companies & contacts",
      "Leads",
      "Opportunities & Kanban",
      "Tasks & activities",
      "Documents",
      "Standard reports",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
  {
    name: "Professional",
    price: "Contact Sales",
    period: "per user / month",
    description: "Complete CRM tools for growing teams.",
    features: [
      "Everything in Starter",
      "Quotes",
      "Invoices",
      "Tickets",
      "Email",
      "Advanced reporting",
      "Automation & API where implemented",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored to your needs",
    description: "Everything in Professional, plus the full Microsoft 365 integration suite.",
    features: [
      "Everything in Professional",
      "Outlook & Microsoft 365 integrations",
      "Outlook Calendar Sync",
      "Microsoft Teams",
      "Zoom integration when configured",
      "Advanced configuration & integrations",
      "Highest supported limits",
    ],
    cta: "Talk to Sales",
    href: "/book-demo",
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-[-5%] size-[400px] rounded-full bg-primary/5 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            Pricing
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with a 7-day full-feature trial. No card required.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Every new workspace gets the complete CRM to evaluate. Choose the
            plan that fits your team when you are ready.
          </p>
        </div>
      </section>

      <ScrollReveal>
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className="relative transition-transform duration-300 hover:-translate-y-1"
                >
                  {/* Badge sits on the wrapper (not the Card): Card clips overflow. */}
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium whitespace-nowrap text-primary-foreground">
                      Most popular
                    </div>
                  )}
                  <Card
                    className={cn(
                      "relative flex h-full flex-col transition-shadow duration-300",
                      tier.popular && "border-primary shadow-lg shadow-primary/10"
                    )}
                  >
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{tier.price}</span>
                      <span className="ml-1 text-sm text-muted-foreground">{tier.period}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-6">
                    <ul className="flex-1 space-y-3">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={tier.popular ? "default" : "outline"}
                      className="w-full"
                      asChild
                    >
                      <Link href={tier.href}>{tier.cta}</Link>
                    </Button>
                  </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--primary)]" aria-hidden />
              <p>
                Microsoft 365 capabilities (Outlook, Calendar Sync, Teams) and
                Zoom are available on Enterprise and require your organization
                to connect the provider — entitlement unlocks the feature, the
                provider connection enables it. Trial workspaces include every
                implemented feature for the full 7-day evaluation.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <FAQSection />
    </MarketingLayout>
  )
}
