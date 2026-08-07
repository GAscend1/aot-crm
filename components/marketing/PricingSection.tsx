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
    name: "Starter",
    description: "For small teams getting started.",
    price: "Contact Sales",
    period: "per seat / month",
    features: [
      "Companies, contacts & leads",
      "Opportunities & pipeline",
      "Kanban board",
      "Tasks & activities",
      "Quotes",
      "Standard reports",
    ],
    cta: { label: "Contact Sales", href: "/contact" },
  },
  {
    name: "Professional",
    description: "For growing teams that need more power.",
    price: "Contact Sales",
    period: "per seat / month",
    highlighted: true,
    features: [
      "Everything in Starter",
      "Outlook Email",
      "Outlook Calendar sync",
      "Microsoft Teams",
      "Advanced analytics",
      "Automation",
      "API access",
      "Priority support",
    ],
    cta: { label: "Contact Sales", href: "/contact" },
  },
  {
    name: "Enterprise",
    description: "For organizations with complex needs.",
    price: "Custom",
    period: "tailored to your needs",
    features: [
      "Everything in Professional",
      "Highest limits",
      "Advanced configuration",
      "Custom integrations",
      "Enterprise security controls",
    ],
    cta: { label: "Talk to Sales", href: "/book-demo" },
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
            Transparent plans that fit your team size and requirements. Talk to
            sales to get started.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {tiers.map((tier) => (
            <motion.div key={tier.name} variants={fadeUp} className="relative">
              {/* Badge sits on the wrapper (not the Card): Card clips overflow. */}
              {tier.highlighted && (
                <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[oklch(0.546_0.245_262.881)] px-3 py-0.5 text-[11px] font-medium whitespace-nowrap text-white">
                  Recommended
                </span>
              )}
              <Card
                className={cn(
                  "relative flex h-full flex-col transition-shadow duration-300",
                  tier.highlighted && "ring-2 ring-[oklch(0.546_0.245_262.881)] shadow-lg",
                )}
              >
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
