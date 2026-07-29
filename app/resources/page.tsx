"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, HelpCircle, Video, ArrowRight } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    title: "Blog",
    description: "Insights, tips, and best practices for CRM, sales, and customer success.",
    icon: BookOpen,
    href: "#",
    articles: [
      "Getting started with pipeline management",
      "5 ways to improve lead conversion rates",
      "Integrating Microsoft 365 with your CRM",
    ],
  },
  {
    title: "Documentation",
    description: "Comprehensive guides, API references, and configuration manuals.",
    icon: FileText,
    href: "#",
    articles: [
      "Installation & setup guide",
      "API reference documentation",
      "Migration from other CRM platforms",
    ],
  },
  {
    title: "Help Center",
    description: "Troubleshooting guides, FAQs, and community discussions.",
    icon: HelpCircle,
    href: "#",
    articles: [
      "Common troubleshooting steps",
      "Account & billing FAQs",
      "Data export and backup guide",
    ],
  },
  {
    title: "Webinars",
    description: "Live and on-demand sessions covering product features and best practices.",
    icon: Video,
    href: "#",
    articles: [
      "Product roadmap overview",
      "Deep dive: automation workflows",
      "Security & compliance best practices",
    ],
  },
];

export default function ResourcesPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-blue-950 to-background py-24 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Resources</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to get the most out of AOT CRM.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 sm:grid-cols-2">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.title}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                      </div>
                      <CardTitle className="mt-3">{s.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{s.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {s.articles.map((a) => (
                          <li key={a} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            &bull; {a}
                          </li>
                        ))}
                      </ul>
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link href={s.href}>
                          View all <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-3xl font-bold">Still have questions?</h2>
            <p className="text-muted-foreground">Our support team is here to help.</p>
            <Button size="lg" asChild>
              <Link href="/contact">Contact Support</Link>
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
