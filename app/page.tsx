"use client"

import {
  CheckCircle, ArrowRight
} from "lucide-react"
import { Header } from "@/components/marketing/Header"
import { Footer } from "@/components/marketing/Footer"
import { Hero } from "@/components/marketing/Hero"
import { TrustedIntegrations } from "@/components/marketing/TrustedIntegrations"
import { UseCaseSelector } from "@/components/marketing/UseCaseSelector"
import { FAQSection } from "@/components/marketing/FAQSection"
import { CTASection } from "@/components/marketing/CTASection"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { CrmDashboard } from "@/components/marketing/CrmDashboard"
import { PipelineDemo } from "@/components/marketing/PipelineDemo"
import { Customer360Demo } from "@/components/marketing/Customer360Demo"
import { AnalyticsDemo } from "@/components/marketing/AnalyticsDemo"
import { MicrosoftEcosystem } from "@/components/marketing/MicrosoftEcosystem"
import { WorkflowAnimation } from "@/components/marketing/WorkflowAnimation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function SectionHeading({ tag, title, description }: { tag?: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {tag && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-[11px] font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          {tag}
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />

        <ScrollReveal>
          <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                tag="Product Tour"
                title="Your entire CRM, at a glance"
                description="Real-time dashboard with pipeline value, revenue forecast, active deals, and team activity — all updated as your team works."
              />
              <div className="mt-10">
                <CrmDashboard floating className="mx-auto max-w-3xl" />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <TrustedIntegrations />

        <ScrollReveal>
          <section className="border-t py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                tag="Pipeline"
                title="Visualize every deal"
                description="From discovery to closed won. Drag deals through stages with full visibility into value, probability, and age."
              />
              <div className="mt-10 rounded-xl border bg-card p-4 sm:p-6">
                <PipelineDemo />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <UseCaseSelector />

        <ScrollReveal>
          <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                tag="Customer 360"
                title="Every interaction, one view"
                description="See the complete relationship with every customer — contacts, emails, meetings, activity history, account health, and next actions."
              />
              <div className="mt-10">
                <Customer360Demo />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="border-t py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                tag="Microsoft 365"
                title="Connected to your ecosystem"
                description="AOT CRM integrates with Microsoft Entra ID, Outlook, Teams, Calendar, Azure SQL, and Blob Storage — all configurable from day one."
              />
              <div className="mt-10">
                <MicrosoftEcosystem />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                <div>
                  <SectionHeading
                    tag="Automation"
                    title="From lead to revenue, automated"
                    description="Watch how AOT CRM connects every step — from first touch to closed deal — with Outlook, Teams, and automated workflows."
                  />
                  <div className="mt-6 space-y-4">
                    {[
                      "Capture leads from any channel",
                      "Auto-qualify with behavior scoring",
                      "Create opportunities and assign owners",
                      "Send Outlook emails with templates",
                      "Schedule Teams meetings from CRM",
                      "Trigger follow-up workflows automatically",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <WorkflowAnimation />
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="border-t py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                tag="Analytics"
                title="Data-driven decisions"
                description="Real-time analytics on pipeline trends, conversion rates, team activity, and revenue forecasts."
              />
              <div className="mt-10">
                <AnalyticsDemo />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                tag="Security"
                title="Enterprise security from the ground up"
                description="Microsoft Entra ID, SOC 2 compliance, AES-256 encryption, and Azure infrastructure. Your data is protected at every layer."
              />
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "SOC 2 Type II", desc: "Certified" },
                  { label: "AES-256", desc: "Encryption at rest" },
                  { label: "TLS 1.3", desc: "Encryption in transit" },
                  { label: "Entra ID", desc: "SSO & MFA" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border bg-card p-5 text-center text-sm transition-shadow hover:shadow-md">
                    <div className="text-lg font-bold">{item.label}</div>
                    <div className="mt-1 text-muted-foreground">{item.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Button asChild variant="outline">
                  <Link href="/security">
                    View Security Details
                    <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
