"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CalendarPlus,
  CheckSquare,
  DollarSign,
  FileUp,
  Mail,
  Plus,
  Users,
  UserPlus,
  TrendingUp,
  Ticket,
  FileText,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityStatusBadge } from "@/components/enterprise/EntityStatusBadge";
import { EntityTabs } from "@/components/enterprise/EntityTabs";
import { EntityTimeline, buildEntityTimeline } from "@/components/enterprise/EntityTimeline";
import { CompanyHealth, computeCompanyHealth } from "@/components/enterprise/CompanyHealth";
import { RelationshipGraph, type RelationshipNode } from "@/components/enterprise/RelationshipGraph";
import { UpcomingMeetingsWidget, OpenTasksWidget } from "@/components/enterprise/EntityUpcomingWidgets";
import { MetricStrip } from "@/components/common/MetricStrip";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EmailTimeline } from "@/components/integrations/EmailTimeline";
import { EventModal } from "@/components/integrations/EventModal";
import { AddTaskDialog } from "@/components/common/AddTaskDialog";
import { UploadEntityDocumentDialog } from "@/components/common/UploadEntityDocumentDialog";
import { stagePillClasses } from "@/lib/stage-pills";
import type { CompanyOverview } from "@/app/api/companies/[id]/overview/route";

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "opportunities", label: "Opportunities", icon: Briefcase },
  { id: "activities", label: "Activities", icon: CheckSquare },
  { id: "meetings", label: "Meetings", icon: CalendarPlus },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "timeline", label: "Timeline", icon: TrendingUp },
];

const moneyFmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [overview, setOverview] = useState<CompanyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchOverview = useCallback(async (): Promise<CompanyOverview> => {
    const res = await fetch(`/api/companies/${id}/overview`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load company");
    return res.json() as Promise<CompanyOverview>;
  }, [id]);

  // Initial load: setState happens in promise callbacks (external data sync),
  // which keeps effects free of synchronous setState cascades.
  useEffect(() => {
    let cancelled = false;
    fetchOverview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) setOverview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchOverview]);

  // Refresh for post-quick-action reloads (event handlers, not effects).
  const reload = useCallback(async () => {
    try {
      setOverview(await fetchOverview());
    } catch {
      setOverview(null);
    }
  }, [fetchOverview]);

  const company = overview?.company;
  const metrics = overview?.metrics;

  const health = useMemo(
    () =>
      metrics
        ? computeCompanyHealth({
            peopleCount: metrics.peopleCount,
            openOpportunities: metrics.openOpportunities,
            pipelineValue: metrics.pipelineValue,
            wonRevenue: metrics.wonRevenue,
            openTickets: metrics.openTickets,
            recentActivityCount: metrics.activitiesCount,
          })
        : null,
    [metrics]
  );

  const timeline = useMemo(
    () =>
      overview
        ? buildEntityTimeline({
            activities: overview.activities,
            documents: overview.documents,
            auditEvents: overview.auditEvents,
          })
        : [],
    [overview]
  );

  const graphNodes = useMemo(() => {
    if (!overview) return { contacts: [] as RelationshipNode[], opportunities: [] as RelationshipNode[], customers: [] as RelationshipNode[] };
    return {
      contacts: overview.contacts.slice(0, 6).map((c) => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}`.trim(),
        sublabel: c.role || c.position || undefined,
        kind: "contact" as const,
        href: `/contacts/${c.id}`,
      })),
      opportunities: overview.opportunities.slice(0, 4).map((o) => ({
        id: o.id,
        label: o.title,
        sublabel: moneyFmt(o.value ?? 0),
        kind: "opportunity" as const,
        href: `/opportunities?record=${encodeURIComponent(o.id)}`,
      })),
      customers: overview.customers.slice(0, 4).map((c) => ({
        id: c.id,
        label: c.name,
        sublabel: c.status,
        kind: "customer" as const,
        href: `/customers?record=${encodeURIComponent(c.id)}`,
      })),
    };
  }, [overview]);

  if (loading && !overview) {
    return (
      <div className="space-y-5">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (!company || !overview || !metrics) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Company not found.</p>
        <Button variant="outline" onClick={() => router.push("/companies")}>
          Back to Companies
        </Button>
      </div>
    );
  }

  const initials = company.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border bg-surface-raised">
        <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
          <Link
            href="/companies"
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Back to companies"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-soft text-lg font-bold text-[color:var(--info)]">
            {initials || "C"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{company.name}</h1>
              {company.status && <EntityStatusBadge label={company.status} />}
              {health && (
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${health.tone === "good" ? "bg-success-soft text-[color:var(--success)] ring-success/25" : health.tone === "warn" ? "bg-warning-soft text-[color:var(--warning)] ring-warning/25" : "bg-danger-soft text-[color:var(--danger)] ring-danger/25"}`}>
                  {health.label}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {[company.industry, company.city, company.country].filter(Boolean).join(" · ") || "No industry on file"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)} disabled={!company.email}>
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Email
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEventOpen(true)}>
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              Add Meeting
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
              <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
              Add Task
            </Button>
            <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
              <FileUp className="mr-1.5 h-3.5 w-3.5" />
              Upload
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/opportunities?companyId=${encodeURIComponent(company.id)}`)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Opportunity
            </Button>
          </div>
        </div>

        <EntityTabs tabs={TABS} active={activeTab} onChange={setActiveTab} id="company360" />
      </div>

      {/* Panels */}
      <div id={`company360-panel-${activeTab}`} role="tabpanel" aria-labelledby={`company360-tab-${activeTab}`} className="space-y-5">
        {activeTab === "overview" && (
          <>
            <MetricStrip
              items={[
                { label: "People", value: metrics.peopleCount, icon: Users },
                { label: "Customers", value: metrics.customersCount, icon: UserPlus },
                { label: "Open Opps", value: metrics.openOpportunities, icon: Briefcase },
                { label: "Pipeline", value: moneyFmt(metrics.pipelineValue), icon: DollarSign, tone: "--chart-1" },
                { label: "Won Revenue", value: moneyFmt(metrics.wonRevenue), icon: TrendingUp, tone: "--success" },
                { label: "Open Tickets", value: metrics.openTickets, icon: Ticket, tone: "--warning" },
              ]}
            />

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-1">
                <CompanyHealth
                  metrics={{
                    peopleCount: metrics.peopleCount,
                    openOpportunities: metrics.openOpportunities,
                    pipelineValue: metrics.pipelineValue,
                    wonRevenue: metrics.wonRevenue,
                    openTickets: metrics.openTickets,
                    recentActivityCount: metrics.activitiesCount,
                  }}
                />
                <UpcomingMeetingsWidget
                  meetings={overview.upcomingMeetings.map((m) => ({
                    id: m.id,
                    subject: m.subject,
                    dueDate: m.date ? new Date(`${m.date}T${m.time || "00:00"}`).toISOString() : "",
                    status: m.status,
                    owner: m.owner,
                  }))}
                />
                <OpenTasksWidget
                  tasks={overview.openTasks.map((t) => ({
                    id: t.id,
                    subject: t.subject,
                    dueDate: t.date ? new Date(`${t.date}T${t.time || "00:00"}`).toISOString() : "",
                    status: t.status,
                    priority: t.owner ? "Normal" : undefined,
                    owner: t.owner,
                  }))}
                />
              </div>

              <div className="space-y-5 lg:col-span-2">
                <RelationshipGraph
                  companyLabel={company.name}
                  contacts={graphNodes.contacts}
                  opportunities={graphNodes.opportunities}
                  customers={graphNodes.customers}
                />

                <section className="rounded-xl border bg-surface-raised">
                  <div className="flex items-center justify-between border-b px-4 py-2.5">
                    <h3 className="text-sm font-semibold text-foreground">
                      Recent Interactions
                      {overview.activities.length > 0 && <span className="ml-1 text-muted-foreground">({overview.activities.length})</span>}
                    </h3>
                    <Button variant="ghost" size="xs" onClick={() => setActiveTab("timeline")}>
                      View all
                    </Button>
                  </div>
                  <div className="p-4">
                    <EntityTimeline entries={timeline.slice(0, 6)} />
                  </div>
                </section>
              </div>
            </div>
          </>
        )}

        {activeTab === "contacts" && (
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">Contacts ({overview.contacts.length})</h3>
              <Button size="sm" variant="outline" onClick={() => router.push(`/contacts?companyId=${encodeURIComponent(company.id)}`)}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Add Person
              </Button>
            </div>
            {overview.contacts.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                No contacts at this company yet.
              </p>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {overview.contacts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contacts/${c.id}`}
                    className="group flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-soft text-xs font-semibold text-[color:var(--info)]">
                      {`${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground group-hover:text-[color:var(--primary)]">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{c.position || c.role || "—"}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground/70">{c.email}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "opportunities" && (
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">Opportunities ({overview.opportunities.length})</h3>
              <Button size="sm" variant="outline" onClick={() => router.push(`/opportunities?companyId=${encodeURIComponent(company.id)}`)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Opportunity
              </Button>
            </div>
            {overview.opportunities.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">No opportunities yet.</p>
            ) : (
              <div className="divide-y">
                {overview.opportunities.map((o) => (
                  <Link
                    key={o.id}
                    href={`/opportunities?record=${encodeURIComponent(o.id)}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{o.title}</span>
                      <span className="block text-xs text-muted-foreground">{o.customer || "No customer"}</span>
                    </span>
                    <span className="hidden text-sm font-semibold text-foreground tabular-nums sm:inline">
                      {moneyFmt(o.value ?? 0)}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${stagePillClasses(o.stage)}`}>
                      {o.stage}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "activities" && (
          <section className="rounded-xl border bg-surface-raised p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Activities</h3>
            <EntityTimeline entries={timeline} />
          </section>
        )}

        {activeTab === "meetings" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <UpcomingMeetingsWidget
              meetings={overview.upcomingMeetings.map((m) => ({
                id: m.id,
                subject: m.subject,
                dueDate: m.date ? new Date(`${m.date}T${m.time || "00:00"}`).toISOString() : "",
                status: m.status,
                owner: m.owner,
              }))}
            />
            <section className="rounded-xl border bg-surface-raised">
              <div className="border-b px-4 py-2.5">
                <h3 className="text-sm font-semibold text-foreground">Recent Meetings</h3>
              </div>
              {overview.activities.filter((a) => a.type === "Meeting").length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">No meetings recorded.</p>
              ) : (
                <div className="divide-y">
                  {overview.activities
                    .filter((a) => a.type === "Meeting")
                    .slice(0, 10)
                    .map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{m.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.date ? new Date(`${m.date}T${m.time || "00:00"}`).toLocaleString() : "No date"}
                            {m.owner ? ` · ${m.owner}` : ""}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {m.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "emails" && (
          <section className="rounded-xl border bg-surface-raised p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Email History</h3>
            <EmailTimeline entityEmail={company.email || undefined} entityName={company.name} />
          </section>
        )}

        {activeTab === "documents" && (
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">Documents ({overview.documents.length})</h3>
              <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                <FileUp className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </Button>
            </div>
            {overview.documents.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">No documents yet.</p>
            ) : (
              <div className="divide-y">
                {overview.documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[d.category, d.type, d.uploadedBy].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.uploadDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "timeline" && (
          <section className="rounded-xl border bg-surface-raised p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Full Timeline</h3>
            <EntityTimeline entries={timeline} />
          </section>
        )}
      </div>

      {/* Dialogs */}
      <EmailComposer
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        to={company.email ? [{ name: company.name, email: company.email }] : []}
        subject=""
      />
      <EventModal open={eventOpen} onClose={() => setEventOpen(false)} entityType="company" entityId={company.id} />
      <AddTaskDialog open={taskOpen} onClose={() => setTaskOpen(false)} entityKind="company" entityId={company.id} onCreated={() => void reload()} />
      <UploadEntityDocumentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        entityKind="company"
        entityId={company.id}
        entityLabel={company.name}
        onUploaded={() => void reload()}
      />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="h-40 animate-pulse rounded-xl bg-muted" />
  );
}
