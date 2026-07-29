"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, FileCheck, Fingerprint, ScrollText, BadgeCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Azure Security",
    description: "Hosted on Microsoft Azure with built-in DDoS protection, network isolation, and advanced threat detection.",
    icon: Shield,
  },
  {
    title: "Data Encryption",
    description: "All data encrypted at rest using AES-256 and in transit with TLS 1.3. Customer-managed keys available for Enterprise.",
    icon: Lock,
  },
  {
    title: "Compliance",
    description: "SOC 2 Type II certified. Compliant with GDPR, CCPA, HIPAA, and ISO 27001 standards.",
    icon: FileCheck,
  },
  {
    title: "Authentication",
    description: "Microsoft Entra ID integration with SSO, MFA, conditional access, and just-in-time privilege management.",
    icon: Fingerprint,
  },
  {
    title: "Audit Logs",
    description: "Immutable audit trail capturing every access, change, and configuration action across the platform.",
    icon: ScrollText,
  },
  {
    title: "Certifications",
    description: "Azure ISV, Microsoft Partner status with ongoing security audits and penetration testing.",
    icon: BadgeCheck,
  },
];

const badges = [
  "SOC 2 Type II",
  "ISO 27001",
  "GDPR",
  "CCPA",
  "HIPAA",
  "Azure ISV",
  "Microsoft Partner",
  "TLS 1.3",
  "AES-256",
  "MFA Required",
];

export default function SecurityPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-blue-950 to-background py-24 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Enterprise-grade security</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Built on Microsoft Azure with the highest standards of data protection and compliance.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <Card key={f.title}>
                    <CardHeader>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                        <Icon className="h-5 w-5 text-green-600 dark:text-green-300" />
                      </div>
                      <CardTitle className="mt-3">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-20">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <h2 className="text-3xl font-bold">Security badges &amp; certifications</h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-full border bg-background px-4 py-2 text-sm font-medium"
                >
                  <BadgeCheck className="mr-1.5 h-4 w-4 text-green-500" />
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

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
