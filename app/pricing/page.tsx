"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { FAQSection } from "@/components/marketing/FAQSection"

const tiers = [
  {
    name: "Trial",
    price: "Free",
    period: "14 days",
    description: "Explore AOT CRM risk-free with full feature access.",
    features: ["Up to 5 users", "Lead & contact management", "Pipeline tracking", "Email integration", "Standard reports", "Community support"],
    cta: "Start Free Trial",
    href: "/login",
    popular: false,
  },
  {
    name: "Starter",
    price: "Contact us",
    period: "per user / month",
    description: "Essential CRM tools for growing teams.",
    features: ["Up to 25 users", "Everything in Trial", "Custom fields & tags", "Automation rules (5)", "API access", "Email support"],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
  {
    name: "Professional",
    price: "Contact us",
    period: "per user / month",
    description: "Advanced features for scaling businesses.",
    features: ["Up to 100 users", "Everything in Starter", "Unlimited automation", "Microsoft 365 integration", "Advanced analytics", "Priority support"],
    cta: "Contact Sales",
    href: "/contact",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual billing",
    description: "Tailored solutions for large organizations.",
    features: ["Unlimited users", "Everything in Professional", "Dedicated infrastructure", "Custom integrations", "SLA guarantees", "Dedicated support manager"],
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
            Choose the plan that fits your team. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      <ScrollReveal>
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 lg:grid-cols-4">
              {tiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={cn(
                    "relative flex flex-col transition-all duration-300 hover:-translate-y-1",
                    tier.popular && "border-primary shadow-lg shadow-primary/10"
                  )}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                      Most popular
                    </div>
                  )}
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
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <FAQSection />
    </MarketingLayout>
  )
}
