"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Play, ArrowRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ProductScreenshot } from "@/components/marketing/ProductScreenshot"
import { VideoModal } from "@/components/marketing/VideoModal"

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
}

const pipelineStages = [
  { label: "Leads", count: 142, color: "bg-blue-500" },
  { label: "Qualified", count: 87, color: "bg-indigo-500" },
  { label: "Proposal", count: 34, color: "bg-cyan-500" },
  { label: "Closed", count: 19, color: "bg-emerald-500" },
]

const recentActivity = [
  { name: "Acme Corp", action: "Meeting scheduled", time: "2m ago" },
  { name: "Northwind Inc.", action: "Deal won", time: "15m ago" },
  { name: "Contoso Ltd.", action: "Email opened", time: "1h ago" },
]

export function Hero() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] size-[500px] rounded-full bg-[oklch(0.546_0.245_262.881)]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] size-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
        >
          <div className="flex flex-col items-start gap-6">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Now with Microsoft 365 Sync
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              Turn every customer interaction into{" "}
              <span className="text-[oklch(0.546_0.245_262.881)]">
                the next right action
              </span>
              .
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Manage leads, customers, pipelines, meetings, follow-ups, and
              Microsoft 365 conversations in one connected CRM.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3"
            >
              <Button asChild size="lg" className="h-10 px-5 text-sm">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-10 px-5 text-sm"
                onClick={() => setVideoOpen(true)}
              >
                <Play className="size-4" />
                Watch Product Tour
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-10 px-5 text-sm">
                <Link href="/book-demo">Book a Demo</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex items-center gap-4 text-xs text-muted-foreground"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-blue-400 to-indigo-500 text-[10px] font-medium text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>Trusted by 500+ teams</span>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="hidden lg:block">
            <ProductScreenshot>
              <div className="space-y-4 p-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Sales Pipeline</h3>
                  <span className="text-xs text-muted-foreground">
                    Q3 2026
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {pipelineStages.map((stage) => (
                    <div
                      key={stage.label}
                      className="rounded-lg border bg-muted/30 p-2.5 text-center"
                    >
                      <div
                        className={cn(
                          "mx-auto mb-1.5 h-1.5 w-8 rounded-full",
                          stage.color,
                        )}
                      />
                      <div className="text-lg font-bold">{stage.count}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {stage.label}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    Recent Activity
                  </h4>
                  {recentActivity.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {item.action}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ProductScreenshot>
          </motion.div>
        </motion.div>
      </div>

      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  )
}

function Separator() {
  return <div className="h-px bg-border" />
}
