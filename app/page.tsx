"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Users, GitBranch, MessageSquare,
  Settings, BarChart3, Shield, CreditCard,
  Globe
} from "lucide-react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { TrustedIntegrations } from "@/components/marketing/TrustedIntegrations";
import { UseCaseSelector } from "@/components/marketing/UseCaseSelector";
import { FAQSection } from "@/components/marketing/FAQSection";
import { CTASection } from "@/components/marketing/CTASection";

/* ====== ANIMATION HELPERS ====== */

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ====== FEATURE SECTIONS ====== */

const features = [
  {
    id: "leads",
    title: "Lead Management",
    subtitle: "From first touch to qualified deal",
    description: "Capture leads from any source, score them automatically, and route to the right rep. Built-in enrichment pulls company and contact data so your team spends less time researching and more time selling.",
    icon: Users,
    items: ["Auto lead capture from web forms, email, and imports", "Behavior-based lead scoring and grading", "Smart assignment and round-robin routing", "Built-in email and phone outreach tools"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "customer360",
    title: "Customer 360",
    subtitle: "Every detail, every interaction, one view",
    description: "See the full picture of every customer relationship. Contact profiles aggregate communication history, deal activity, support tickets, meeting notes, and engagement data into a single, searchable timeline.",
    icon: Globe,
    items: ["Unified contact timeline with all interactions", "Relationship mapping and org chart visualization", "Communication history across email, chat, and calls", "Custom fields and tags for any workflow"],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "pipeline",
    title: "Pipeline Management",
    subtitle: "Visualize, forecast, and close",
    description: "Drag deals through customizable stages with full visibility into conversion rates, velocity, and expected revenue. Forecasting tools help leadership make confident decisions based on real pipeline data.",
    icon: GitBranch,
    items: ["Drag-and-drop deal management", "Customizable stages and sales processes", "Real-time revenue forecasting", "Conversion analytics and velocity tracking"],
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "communication",
    title: "Unified Communications",
    subtitle: "Outlook, Teams, Zoom — all inside CRM",
    description: "Connect and log every customer conversation automatically. Sync emails and calendar events from Outlook, join Teams meetings from any record, and schedule Zoom calls without switching apps.",
    icon: MessageSquare,
    items: ["Two-way Outlook email and calendar sync", "Microsoft Teams presence and meeting launch", "Zoom meeting scheduling and auto-logging", "Unified activity feed across all channels"],
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    id: "automation",
    title: "Workflow Automation",
    subtitle: "Let the platform do the heavy lifting",
    description: "Build rule-based workflows that trigger actions, send notifications, update records, and keep your team aligned. From lead assignment to follow-up reminders, automate the repetitive so your team can focus on relationships.",
    icon: Settings,
    items: ["Visual workflow builder with triggers and actions", "Automated email sequences and follow-ups", "Conditional field updates and data enrichment", "Slack and Teams notifications on events"],
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "analytics",
    title: "Analytics & Reporting",
    subtitle: "Data-driven decisions, real-time insights",
    description: "Custom dashboards and reports give every stakeholder the metrics that matter. Powered by Azure data services, AOT CRM processes large datasets without slowing down your team.",
    icon: BarChart3,
    items: ["Customizable dashboards per role", "Pipeline and revenue analytics", "Activity and productivity reports", "Export to PDF, CSV, or schedule delivery"],
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: "security",
    title: "Security & Azure Readiness",
    subtitle: "Enterprise security from day one",
    description: "Built on Microsoft Azure and secured by Microsoft Entra ID, AOT CRM meets the highest standards for data protection, compliance, and identity management. SOC 2, GDPR, and HIPAA compliant out of the box.",
    icon: Shield,
    items: ["Microsoft Entra ID with MFA and conditional access", "Encryption at rest (AES-256) and in transit (TLS 1.3)", "SOC 2 Type II and ISO 27001 certified", "Immutable audit logs and role-based access control"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "pricingPreview",
    title: "Transparent Pricing",
    subtitle: "Start free, scale as you grow",
    description: "AOT CRM offers a generous free trial with full feature access. As your team grows, choose from flexible plans that fit your budget. No hidden fees, no surprise charges.",
    icon: CreditCard,
    items: ["14-day free trial, no credit card required", "Starter plan for small teams", "Professional plan with Microsoft 365 integration", "Enterprise plan with dedicated infrastructure"],
    gradient: "from-teal-500 to-green-500",
  },
];

function SectionCard({ feature, index }: { feature: typeof features[number]; index: number }) {
  const Icon = feature.icon;
  return (
    <FadeIn delay={index * 0.1}>
      <div className="grid gap-8 lg:grid-cols-2 items-center py-16 first:pt-0">
        <div className={cn("space-y-6", index % 2 === 1 && "lg:order-2")}>
          <div className={cn("inline-flex rounded-lg bg-gradient-to-r p-0.5", feature.gradient)}>
            <div className="flex items-center gap-2 rounded-md bg-background px-3 py-1">
              <Icon className="h-4 w-4 text-foreground" />
              <span className="text-xs font-medium text-foreground">{feature.subtitle}</span>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground">{feature.title}</h3>
          <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
          <ul className="space-y-3">
            {feature.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
                <CheckCircle className={cn("mt-0.5 h-4 w-4 shrink-0", feature.gradient.includes("blue") ? "text-blue-400" : "text-green-400")} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className={cn("flex justify-center", index % 2 === 1 && "lg:order-1")}>
          <div className={cn(
            "relative h-64 w-64 sm:h-72 sm:w-72 rounded-2xl border border-white/10 bg-gradient-to-br p-6",
            feature.gradient.includes("blue") ? "from-blue-500/10 to-cyan-500/10" :
            feature.gradient.includes("green") ? "from-green-500/10 to-emerald-500/10" :
            feature.gradient.includes("purple") ? "from-purple-500/10 to-pink-500/10" :
            feature.gradient.includes("orange") ? "from-orange-500/10 to-red-500/10" :
            feature.gradient.includes("violet") ? "from-violet-500/10 to-purple-500/10" :
            feature.gradient.includes("teal") ? "from-teal-500/10 to-green-500/10" :
            "from-blue-500/10 to-cyan-500/10"
          )}>
            <Icon className="h-20 w-20 text-white/20 absolute bottom-4 right-4" />
            <div className="space-y-3">
              <div className="h-2 w-24 rounded-full bg-white/10" />
              <div className="h-2 w-32 rounded-full bg-white/5" />
              <div className="h-2 w-20 rounded-full bg-white/5" />
              <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="h-12 rounded-lg bg-white/5 border border-white/5" />
                <div className="h-12 rounded-lg bg-white/5 border border-white/5" />
                <div className="h-12 rounded-lg bg-white/5 border border-white/5" />
                <div className="h-12 rounded-lg bg-white/5 border border-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

/* ====== MAIN PAGE ====== */

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustedIntegrations />
        <UseCaseSelector />

        <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your team needs to build lasting relationships
              </h2>
              <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
                From lead capture to post-sale success, AOT CRM provides every tool your team needs in one connected platform.
              </p>
            </FadeIn>

            <div className="mt-8 divide-y divide-border">
              {features.slice(0, 3).map((f, i) => (
                <SectionCard key={f.id} feature={f} index={i} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
                Connect, communicate, and collaborate
              </h2>
              <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
                AOT CRM brings your communication tools together so every customer interaction is logged and accessible.
              </p>
            </FadeIn>
            <div className="mt-8 divide-y divide-border">
              {features.slice(3, 5).map((f, i) => (
                <SectionCard key={f.id} feature={f} index={i} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20 dark:bg-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
                Insights, security, and scalability
              </h2>
              <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
                Built on Azure with enterprise-grade security, analytics, and flexible pricing.
              </p>
            </FadeIn>
            <div className="mt-8 divide-y divide-border">
              {features.slice(5).map((f, i) => (
                <SectionCard key={f.id} feature={f} index={i} />
              ))}
            </div>
          </div>
        </section>

        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
