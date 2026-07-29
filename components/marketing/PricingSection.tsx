"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface PricingTier {
  name: string
  description: string
  price: string
  period: string
  highlighted?: boolean
  features: string[]
  cta: { label: string; href: string }
}

const tiers: PricingTier[] = [
  {
    name: "Trial",
    description: "Explore the full platform risk-free.",
    price: "Free",
    period: "14 days",
    features: [
      "Up to 10 contacts",
      "Pipeline management",
      "Email sync",
      "Community support",
    ],
    cta: { label: "Start Free Trial", href: "/login" },
  },
  {
    name: "Starter",
    description: "For small teams getting started.",
    price: "Contact us",
    period: "per seat / month",
    features: [
      "Unlimited contacts",
      "Pipeline management",
      "Email & calendar sync",
      "Basic automation",
      "Reporting dashboards",
      "Standard support",
    ],
    cta: { label: "Talk to Sales", href: "/book-demo" },
  },
  {
    name: "Professional",
    description: "For growing teams that need more power.",
    price: "Contact us",
    period: "per seat / month",
    highlighted: true,
    features: [
      "Everything in Starter",
      "Advanced automation",
      "Custom workflows",
      "Teams integration",
      "Sales forecasting",
      "API access",
      "Priority support",
    ],
    cta: { label: "Talk to Sales", href: "/book-demo" },
  },
  {
    name: "Enterprise",
    description: "For organizations with complex needs.",
    price: "Contact us",
    period: "custom pricing",
    features: [
      "Everything in Professional",
      "Azure SQL integration",
      "Custom data retention",
      "SSO & SCIM provisioning",
      "Dedicated success manager",
      "99.9% SLA",
      "24/7 premium support",
    ],
    cta: { label: "Contact Us", href: "/book-demo" },
  },
]

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function PricingSection() {
  return (
    <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-3 text-muted-foreground"
          >
            Start free, then scale with a plan that fits your team size and
            requirements.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {tiers.map((tier) => (
            <motion.div key={tier.name} variants={fadeUp}>
              <Card
                className={cn(
                  "relative flex h-full flex-col transition-shadow duration-300",
                  tier.highlighted && "ring-2 ring-[oklch(0.546_0.245_262.881)] shadow-lg",
                )}
              >
                {tier.highlighted && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[oklch(0.546_0.245_262.881)] px-3 py-0.5 text-[11px] font-medium text-white">
                    Recommended
                  </span>
                )}
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    {tier.period && (
                      <span className="ml-1.5 text-sm text-muted-foreground">
                        {tier.period}
                      </span>
                    )}
                  </div>
                  <ul className="mb-6 flex-1 space-y-2.5">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-[oklch(0.546_0.245_262.881)]" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={tier.highlighted ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href={tier.cta.href}>{tier.cta.label}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
