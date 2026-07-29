"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Contact2,
  GitBranch,
  MessageSquare,
  Zap,
  BarChart3,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UseCase {
  id: string
  label: string
  icon: typeof Users
  description: string
  features: string[]
}

const useCases: UseCase[] = [
  {
    id: "leads",
    label: "Lead Management",
    icon: Users,
    description:
      "Capture, qualify, and nurture leads from every channel. Automate follow-ups and score prospects based on engagement signals from email and meetings.",
    features: [
      "Multi-channel lead capture",
      "Automated lead scoring",
      "Email sequence builder",
      "Activity timeline",
    ],
  },
  {
    id: "customer360",
    label: "Customer 360",
    icon: Contact2,
    description:
      "Unify customer data from Microsoft 365, support tickets, and sales interactions into a single timeline you can act on.",
    features: [
      "Unified contact timeline",
      "Microsoft 365 sync",
      "Interaction history",
      "Relationship mapping",
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline Management",
    icon: GitBranch,
    description:
      "Visualize every deal in your pipeline with drag-and-drop stages. Forecast revenue and spot bottlenecks before they stall.",
    features: [
      "Visual Kanban pipeline",
      "Drag-and-drop stages",
      "Revenue forecasting",
      "Deal health scoring",
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: MessageSquare,
    description:
      "Keep every conversation connected to a contact or deal. Sync Outlook emails, Teams chats, and meeting notes automatically.",
    features: [
      "Outlook email sync",
      "Teams chat integration",
      "Meeting notes linking",
      "In-app notifications",
    ],
  },
  {
    id: "automation",
    label: "Automation",
    icon: Zap,
    description:
      "Eliminate repetitive work with rule-based triggers and workflows that update records, send emails, and assign tasks.",
    features: [
      "Workflow builder",
      "Trigger-based actions",
      "Task automation",
      "Email templates",
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description:
      "Get real-time dashboards and reports on your sales performance, customer health, and team activity.",
    features: [
      "Custom dashboards",
      "Sales performance reports",
      "Customer health score",
      "Export to Excel",
    ],
  },
]

export function UseCaseSelector() {
  const [active, setActive] = useState(useCases[0].id)
  const activeCase = useCases.find((uc) => uc.id === active)!

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            One platform, every use case
          </h2>
          <p className="mt-3 text-muted-foreground">
            From first touch to long-term relationship — AOT CRM grows with your
            workflow.
          </p>
        </div>

        <div className="mt-12">
          <div
            className="flex flex-wrap justify-center gap-1 rounded-xl border bg-muted/30 p-1"
            role="tablist"
            aria-label="Use cases"
          >
            {useCases.map((uc) => {
              const Icon = uc.icon
              const isActive = active === uc.id
              return (
                <button
                  key={uc.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(uc.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{uc.label}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-10 min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCase.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mx-auto max-w-2xl text-center"
              >
                <p className="text-lg text-muted-foreground">
                  {activeCase.description}
                </p>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {activeCase.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 rounded-lg border bg-muted/20 px-4 py-2.5 text-sm"
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-[oklch(0.546_0.245_262.881)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
