"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
];

const faqs = [
  { q: "Is there a free trial?", a: "Yes, we offer a 14-day free trial with full access to all features. No credit card required." },
  { q: "Can I upgrade my plan at any time?", a: "Absolutely. You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, wire transfers, and can issue purchase orders for Enterprise plans." },
  { q: "Is my data secure?", a: "Yes. AOT CRM is hosted on Microsoft Azure with SOC 2 compliance, encryption at rest and in transit, and Microsoft Entra ID authentication." },
  { q: "Do you offer discounts for nonprofits?", a: "Yes, we offer special pricing for nonprofit organizations. Contact our sales team to learn more." },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-blue-950 to-background py-24 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple, transparent pricing</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that fits your team. No hidden fees, no surprises.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 lg:grid-cols-4">
              {tiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={cn(
                    "relative flex flex-col",
                    tier.popular && "border-blue-500 shadow-lg shadow-blue-500/10"
                  )}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
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

        <section className="bg-muted/50 py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center text-3xl font-bold">Frequently asked questions</h2>
            <div className="mt-12 space-y-6">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-lg border p-4 open:bg-muted/30">
                  <summary className="flex cursor-pointer items-center justify-between font-medium">
                    {faq.q}
                    <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <img src="/Logo.png" alt="AOT" className="h-8 w-8" />
          AOT CRM
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/book-demo">Book a Demo</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Ascend One Tech. All rights reserved.
      </div>
    </footer>
  );
}
