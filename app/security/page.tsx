"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, FileCheck, Fingerprint, ScrollText, BadgeCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { cn } from "@/lib/utils"

const features = [
  { title: "Azure Security", description: "Hosted on Microsoft Azure with built-in DDoS protection, network isolation, and advanced threat detection.", icon: Shield, gradient: "from-blue-500 to-cyan-500" },
  { title: "Data Encryption", description: "All data encrypted at rest using AES-256 and in transit with TLS 1.3. Customer-managed keys available for Enterprise.", icon: Lock, gradient: "from-emerald-500 to-teal-500" },
  { title: "Compliance", description: "SOC 2 Type II certified. Compliant with GDPR, CCPA, HIPAA, and ISO 27001 standards.", icon: FileCheck, gradient: "from-purple-500 to-indigo-500" },
  { title: "Authentication", description: "Microsoft Entra ID integration with SSO, MFA, conditional access, and just-in-time privilege management.", icon: Fingerprint, gradient: "from-amber-500 to-orange-500" },
  { title: "Audit Logs", description: "Immutable audit trail capturing every access, change, and configuration action across the platform.", icon: ScrollText, gradient: "from-rose-500 to-pink-500" },
  { title: "Certifications", description: "Azure ISV, Microsoft Partner status with ongoing security audits and penetration testing.", icon: BadgeCheck, gradient: "from-cyan-500 to-blue-500" },
]

const badges = [
  "SOC 2 Type II", "ISO 27001", "GDPR", "CCPA", "HIPAA", "Azure ISV", "Microsoft Partner", "TLS 1.3", "AES-256", "MFA Required",
]

export default function SecurityPage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-[-5%] size-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
            <Shield className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Trust & Compliance
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Enterprise-grade security</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Built on Microsoft Azure with the highest standards of data protection and compliance.
          </p>
        </div>
      </section>

      <ScrollReveal>
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <Card key={f.title} className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardHeader>
                      <div className={cn("inline-flex rounded-lg bg-gradient-to-r p-0.5", f.gradient)}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background">
                          <Icon className="h-5 w-5 text-foreground" />
                        </div>
                      </div>
                      <CardTitle className="mt-3">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="bg-muted/50 py-20 dark:bg-transparent">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h2 className="text-3xl font-bold">Security badges &amp; certifications</h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-full border bg-background px-4 py-2 text-sm font-medium transition-shadow hover:shadow-sm"
                >
                  <BadgeCheck className="mr-1.5 h-4 w-4 text-emerald-500" />
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-3xl font-bold">Want to learn more?</h2>
            <p className="text-muted-foreground">Download our security whitepaper or contact our security team.</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Security Team</Link>
              </Button>
              <Button asChild>
                <Link href="/book-demo">Book a Demo <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </MarketingLayout>
  )
}
