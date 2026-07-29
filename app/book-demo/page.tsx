"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CalendarDays, CheckCircle, Loader2, Star, Users, BarChart3, Shield } from "lucide-react"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"

const benefits = [
  { icon: Users, text: "Tailored to your industry and team size" },
  { icon: BarChart3, text: "See your real data in the product" },
  { icon: Star, text: "30-minute live walkthrough with Q&A" },
  { icon: Shield, text: "No commitment, no sales pressure" },
]

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSending(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <MarketingLayout>
        <section className="flex items-center justify-center py-24">
          <Card className="w-full max-w-lg text-center">
            <CardContent className="pt-10 pb-10 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
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
        </section>
      </MarketingLayout>
    )
  }

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-[-5%] size-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] size-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
                <span className="size-1.5 rounded-full bg-primary" />
                Personal Demo
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">See AOT CRM in action</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl">
                A personalized walkthrough tailored to your business needs. See how AOT CRM connects leads, customers, pipelines, and Microsoft 365 in one platform.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((b) => {
                  const Icon = b.icon
                  return (
                    <li key={b.text} className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground pt-1">{b.text}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Request a demo</CardTitle>
                <p className="text-sm text-muted-foreground">Fill in your details and we will get back to you within one business day.</p>
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
    </MarketingLayout>
  )
}
