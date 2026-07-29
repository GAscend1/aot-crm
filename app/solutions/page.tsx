"use client";

import { Button } from "@/components/ui/button";
import { Building2, Store, Users, Target, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

const solutions = [
  {
    title: "Small Business",
    subtitle: "Grow smarter, not harder",
    description: "Affordable CRM tools tailored for small teams. Manage leads, track communications, and close deals faster without enterprise complexity.",
    icon: Store,
    benefits: ["Lead & contact management", "Pipeline tracking", "Email integration", "Reporting dashboard", "Up to 10 users"],
  },
  {
    title: "Enterprise",
    subtitle: "Scale with confidence",
    description: "Full-featured CRM with advanced security, compliance, and Microsoft 365 integration for large organizations.",
    icon: Building2,
    benefits: ["Azure-hosted infrastructure", "Microsoft Entra SSO", "Advanced automation", "Audit logs & compliance", "Unlimited users"],
  },
  {
    title: "Sales Teams",
    subtitle: "Close more deals",
    description: "Equip your sales team with pipeline visibility, automated follow-ups, and real-time collaboration tools.",
    icon: Target,
    benefits: ["Visual sales pipeline", "Automated sequences", "Meeting scheduling", "Activity tracking", "Mobile access"],
  },
  {
    title: "Customer Success",
    subtitle: "Delight at every touchpoint",
    description: "Proactive account management with 360-degree customer views, automated health scoring, and timely engagement.",
    icon: Users,
    benefits: ["Customer 360 profiles", "Health scoring", "Automated check-ins", "Support ticket tracking", "NPS & satisfaction surveys"],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-blue-950 to-background py-24 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Solutions for every team</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you are a five-person team or a global enterprise, AOT CRM adapts to your workflow.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 space-y-16">
            {solutions.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="grid gap-8 lg:grid-cols-2 items-center">
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{s.subtitle}</p>
                    <h2 className="text-3xl font-bold">{s.title}</h2>
                    <p className="text-muted-foreground">{s.description}</p>
                    <ul className="space-y-2">
                      {s.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <div className="h-64 w-64 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Icon className="h-24 w-24 text-blue-600/30 dark:text-blue-400/30" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-muted/50 py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-3xl font-bold">Not sure which solution fits?</h2>
            <p className="text-muted-foreground">Talk to our team for a personalized recommendation.</p>
            <Button size="lg" asChild>
              <Link href="/book-demo">
                Book a Demo <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
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
