"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalendarDays, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center py-24">
          <Card className="w-full max-w-lg text-center">
            <CardContent className="pt-10 pb-10 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle className="text-2xl">Demo request captured</CardTitle>
              <p className="text-muted-foreground">
                Your information has been captured in this local preview. Submission delivery will be enabled when the contact service is configured.
              </p>
              <Button asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-blue-950 to-background py-24 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
              <CalendarDays className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Book a demo</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              See AOT CRM in action. A personalized walkthrough tailored to your business needs.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">What to expect</h2>
                <ul className="space-y-4">
                  {[
                    "30-minute live demo with a product specialist",
                    "Tailored to your industry and use case",
                    "Q&A session after the walkthrough",
                    "No commitment, no sales pressure",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-lg border bg-muted/30 p-6 space-y-3">
                  <h3 className="font-semibold">Why AOT CRM?</h3>
                  <p className="text-sm text-muted-foreground">
                    Built on Microsoft Azure with native Microsoft 365 integration, AOT CRM unifies
                    your customer data, communications, and workflows in one secure platform.
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Request a demo</CardTitle>
                  <p className="text-sm text-muted-foreground">Fill in your details and we will get back to you.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium">Full name</label>
                      <Input id="name" required placeholder="John Smith" className="mt-1" />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-medium">Work email</label>
                      <Input id="email" type="email" required placeholder="john@company.com" className="mt-1" />
                    </div>
                    <div>
                      <label htmlFor="company" className="text-sm font-medium">Company</label>
                      <Input id="company" required placeholder="Acme Inc." className="mt-1" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="text-sm font-medium">Phone (optional)</label>
                      <Input id="phone" type="tel" placeholder="+1 555-123-4567" className="mt-1" />
                    </div>
                    <Button type="submit" disabled={sending} className="w-full h-12">
                      {sending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                      ) : (
                        <><CalendarDays className="mr-2 h-4 w-4" /> Book a Demo</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
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
