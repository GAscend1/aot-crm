"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Mail, Video, Radio, Database, HardDrive, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Integration {
  name: string
  icon: typeof Shield
  status: "Available" | "Admin Approval" | "Ready" | "Configurable"
  color: "emerald" | "amber" | "blue"
}

const integrations: Integration[] = [
  {
    name: "Microsoft Entra ID",
    icon: Shield,
    status: "Available",
    color: "emerald",
  },
  { name: "Outlook", icon: Mail, status: "Admin Approval", color: "amber" },
  { name: "Teams", icon: Video, status: "Admin Approval", color: "amber" },
  { name: "Zoom", icon: Radio, status: "Ready", color: "emerald" },
  { name: "Azure SQL", icon: Database, status: "Configurable", color: "blue" },
  {
    name: "Azure Blob",
    icon: HardDrive,
    status: "Configurable",
    color: "blue",
  },
]

const statusStyles: Record<string, string> = {
  Available:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Admin Approval":
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Ready:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Configurable:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function TrustedIntegrations() {
  return (
    <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="flex flex-col items-center text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Seamlessly connected
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-3 max-w-2xl text-muted-foreground"
          >
            AOT CRM integrates with the tools your team already uses, starting
            with the Microsoft 365 ecosystem.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {integrations.map((integration) => {
            const Icon = integration.icon
            return (
              <motion.div key={integration.name} variants={fadeUp}>
                <Card className="group/card transition-shadow duration-300 hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">
                        {integration.name}
                      </span>
                      <span
                        className={cn(
                          "mt-1 inline-flex self-start rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          statusStyles[integration.status],
                        )}
                      >
                        {integration.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10 text-center"
        >
          <Button asChild variant="ghost">
            <Link href="/integrations">
              View all integrations
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
