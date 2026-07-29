"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Mock send - in production, send to API
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-blue-950 to-background py-24 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Contact us</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              We would love to hear from you. Get in touch with our team.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold">Send us a message</h2>
                <p className="mt-2 text-muted-foreground">
                  Fill out the form and our team will get back to you within one business day.
                </p>

                {submitted ? (
                  <Card className="mt-8 border-blue-500/30 bg-blue-500/5">
                    <CardContent className="pt-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                        <Mail className="h-6 w-6 text-blue-500" />
                      </div>
                      <h3 className="mt-4 font-semibold">Information captured</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Your information has been captured in this local preview. Submission delivery will be enabled when the contact service is configured.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium">Full name</label>
                      <Input id="name" required placeholder="John Smith" className="mt-1" />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input id="email" type="email" required placeholder="john@company.com" className="mt-1" />
                    </div>
                    <div>
                      <label htmlFor="company" className="text-sm font-medium">Company</label>
                      <Input id="company" placeholder="Acme Inc." className="mt-1" />
                    </div>
                    <div>
                      <label htmlFor="message" className="text-sm font-medium">Message</label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="How can we help?"
                      />
                    </div>
                    <Button type="submit" disabled={sending} className="w-full">
                      {sending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" /> Send Message</>
                      )}
                    </Button>
                  </form>
                )}
              </div>

              <div className="space-y-8">
                <h2 className="text-2xl font-bold">Other ways to reach us</h2>
                <div className="space-y-6">
                  {[
                    { icon: Mail, label: "Email", value: "sales@aotcrm.com", sub: "For sales inquiries" },
                    { icon: Mail, label: "Support", value: "support@aotcrm.com", sub: "For technical support" },
                    { icon: Phone, label: "Phone", value: "+1 (555) 123-4567", sub: "Mon-Fri 9am-6pm EST" },
                    { icon: MapPin, label: "Office", value: "123 Azure Lane, Suite 400", sub: "San Francisco, CA 94105" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-foreground">{item.value}</p>
                          <p className="text-xs text-muted-foreground">{item.sub}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
