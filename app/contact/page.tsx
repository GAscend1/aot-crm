"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare, Clock, Shield } from "lucide-react"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { cn } from "@/lib/utils"

const contactMethods = [
  { icon: Mail, label: "Sales Inquiries", value: "sales@aotcrm.com", sub: "For sales and demo questions" },
  { icon: Mail, label: "Technical Support", value: "support@aotcrm.com", sub: "For technical assistance" },
  { icon: Phone, label: "Phone", value: "+1 (555) 123-4567", sub: "Mon-Fri 9am-6pm EST" },
  { icon: MapPin, label: "Office", value: "123 Azure Lane, Suite 400", sub: "San Francisco, CA 94105" },
]

const responseTimes = [
  { icon: MessageSquare, label: "Email response", value: "Within 4 hours", color: "text-emerald-500" },
  { icon: Clock, label: "Phone support", value: "Immediate during business hours", color: "text-blue-500" },
  { icon: Shield, label: "Enterprise SLA", value: "30-minute critical response", color: "text-amber-500" },
]

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    const form = e.currentTarget
    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement)?.value || undefined,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
      source: "CONTACT",
    }
    try {
      const res = await fetch("/api/sales-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Submission failed")
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-[-5%] size-[400px] rounded-full bg-primary/5 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
              <span className="size-1.5 rounded-full bg-primary" />
              Get in Touch
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Contact us</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              We would love to hear from you. Our team typically responds within a few hours.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3">
              {submitted ? (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="pt-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Mail className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="mt-4 font-semibold">Thanks. Your request has been received.</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Our sales team will get back to you within one business day. No
                      payment is required to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold">Send us a message</h2>
                  <p className="mt-2 text-muted-foreground">
                    Fill out the form and our team will get back to you within one business day.
                  </p>
                  {error && (
                    <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium">Full name</label>
                        <Input id="name" required placeholder="John Smith" className="mt-1" />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input id="email" type="email" required placeholder="john@company.com" className="mt-1" />
                      </div>
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
                    <Button type="submit" disabled={sending} className="w-full sm:w-auto">
                      {sending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" /> Send Message</>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold">Other ways to reach us</h2>
                <div className="mt-6 space-y-5">
                  {contactMethods.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-foreground">{item.value}</p>
                          <p className="text-xs text-muted-foreground">{item.sub}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-5">
                <h3 className="font-semibold">Response times</h3>
                <div className="mt-4 space-y-3">
                  {responseTimes.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="flex items-start gap-3">
                        <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", item.color)} />
                        <div className="text-sm">
                          <span className="font-medium">{item.label}:</span>{" "}
                          <span className="text-muted-foreground">{item.value}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}


