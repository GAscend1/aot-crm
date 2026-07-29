"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Shield, Mail, MessageSquare, Video, Database, HardDrive } from "lucide-react";
import Link from "next/link";

const integrations = [
  { name: "Microsoft Entra ID", description: "Enterprise-grade authentication and identity management.", icon: Shield, status: "available" as const },
  { name: "Outlook", description: "Email, calendar, and contact sync with Microsoft 365.", icon: Mail, status: "admin-required" as const },
  { name: "Teams", description: "Collaborate on CRM records directly within Microsoft Teams.", icon: MessageSquare, status: "admin-required" as const },
  { name: "Zoom", description: "Schedule and log Zoom meetings linked to CRM records.", icon: Video, status: "ready" as const },
  { name: "Azure SQL", description: "Secure, scalable database for CRM data storage.", icon: Database, status: "ready" as const },
  { name: "Azure Blob", description: "Document and file storage with Azure Blob Storage.", icon: HardDrive, status: "ready" as const },
];

function StatusBadge({ status }: { status: "available" | "admin-required" | "ready" }) {
  const styles = {
    available: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    "admin-required": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    ready: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  };
  const labels = {
    available: "Available",
    "admin-required": "Requires Admin Approval",
    ready: "Ready to Connect",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

export default function IntegrationsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-blue-950 to-background py-24 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Integrations</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect AOT CRM with the tools your team already uses every day.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {integrations.map((i) => {
                const Icon = i.icon;
                return (
                  <Card key={i.name} className="group transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <StatusBadge status={i.status} />
                      </div>
                      <CardTitle className="mt-3">{i.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{i.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-3xl font-bold">Need a custom integration?</h2>
            <p className="text-muted-foreground">Our API and webhook support make it easy to connect any system.</p>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Sales</Link>
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
