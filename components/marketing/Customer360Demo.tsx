"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { demoCompanies, demoContacts, demoActivities, demoMeetings } from "@/lib/demo-data"
import { Mail, Phone, Calendar, CheckCircle2, Clock, Star } from "lucide-react"

const tabs = [
  { id: "overview", label: "Overview", icon: Star },
  { id: "activity", label: "Activity", icon: Clock },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "meetings", label: "Meetings", icon: Calendar },
]

export function Customer360Demo() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCompany, setSelectedCompany] = useState(demoCompanies[0].id)
  const company = demoCompanies.find(c => c.id === selectedCompany) || demoCompanies[0]
  const contacts = demoContacts.filter(c => c.company === company.name)
  const activities = demoActivities.filter(a => a.company === company.name)

  const healthScore = company.stage === "customer" ? 92 : company.stage === "proposal" ? 68 : 45

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-2 lg:col-span-1">
        <div className="text-[11px] font-medium text-muted-foreground">Select Account</div>
        {demoCompanies.slice(0, 5).map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCompany(c.id)}
            className={cn(
              "w-full rounded-lg border bg-card p-3 text-left text-xs transition-all hover:shadow-sm",
              selectedCompany === c.id && "ring-2 ring-primary"
            )}
          >
            <div className="font-medium">{c.name}</div>
            <div className="mt-0.5 text-muted-foreground">{c.industry}</div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className={cn(
                "rounded-full px-1.5 py-0.5",
                c.stage === "customer" ? "bg-emerald-500/10 text-emerald-600" :
                c.stage === "proposal" ? "bg-indigo-500/10 text-indigo-600" :
                "bg-blue-500/10 text-blue-600"
              )}>
                {c.stage}
              </span>
              <span>${c.value.toLocaleString()}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-xl border bg-card">
          <div className="border-b bg-muted/20 px-4 py-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{company.name}</h3>
                <p className="text-xs text-muted-foreground">{company.industry} &middot; ${company.value.toLocaleString()} ARR</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
                  healthScore >= 80 ? "bg-emerald-500/10 text-emerald-600" :
                  healthScore >= 50 ? "bg-amber-500/10 text-amber-600" :
                  "bg-red-500/10 text-red-600"
                )}>
                  <Star className="size-3" />
                  Health {healthScore}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-0 border-b bg-muted/10">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-4">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {contacts.slice(0, 3).map((contact) => (
                    <div key={contact.id} className="rounded-lg border bg-card p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-[11px] font-medium text-white">
                          {contact.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-muted-foreground">{contact.role}</div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="size-3" /> {contact.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-3" /> {contact.phone}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Recent Engagement</span>
                    <span className="text-muted-foreground/60">Last 7 days</span>
                  </div>
                  {activities.slice(0, 3).map((a) => (
                    <div key={a.id} className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <div className={cn(
                        "size-1.5 rounded-full",
                        a.type === "email" ? "bg-blue-500" : a.type === "meeting" ? "bg-cyan-500" : a.type === "task" ? "bg-violet-500" : "bg-amber-500"
                      )} />
                      <span className="flex-1 truncate">{a.subject}</span>
                      <span className="shrink-0">{a.time}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    <span className="font-medium">Next Action</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">Follow up on Q3 proposal review — scheduled for tomorrow</p>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-1">
                {activities.map((a) => {
                  const typeColors: Record<string, string> = { email: "bg-blue-500", meeting: "bg-cyan-500", note: "bg-amber-500", task: "bg-violet-500", call: "bg-emerald-500" }
                  return (
                    <div key={a.id} className="flex items-start gap-3 rounded-lg p-2 text-xs hover:bg-muted/30">
                      <div className={cn("mt-1 size-2 rounded-full shrink-0", typeColors[a.type] || "bg-muted-foreground")} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{a.subject}</div>
                        <div className="text-muted-foreground">{a.contact} &middot; {a.company}</div>
                      </div>
                      <div className="shrink-0 text-[10px] text-muted-foreground/60">{a.time}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === "emails" && (
              <div className="space-y-2">
                {demoMeetings.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg border bg-card p-3 text-xs">
                    <Mail className="size-4 text-blue-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{m.title}</div>
                      <div className="text-muted-foreground">To: {m.with}</div>
                      <div className="mt-1 text-muted-foreground/60 truncate">Meeting scheduled for {m.date} at {m.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "meetings" && (
              <div className="space-y-2">
                {demoMeetings.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg border bg-card p-3 text-xs">
                    <Calendar className="size-4 text-cyan-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{m.title}</div>
                      <div className="text-muted-foreground">{m.with} &middot; {m.company}</div>
                      <div className="mt-1 flex items-center gap-2 text-muted-foreground/60">
                        <span>{m.date} at {m.time}</span>
                        <span>{m.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
