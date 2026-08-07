"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarPlus,
  CheckSquare,
  DollarSign,
  FileText,
  FileUp,
  Loader2,
  Mail,
  Phone,
  Plus,
  StickyNote,
  TrendingUp,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityStatusBadge } from "@/components/enterprise/EntityStatusBadge";
import { EntityTabs } from "@/components/enterprise/EntityTabs";
import { EntityTimeline, buildEntityTimeline } from "@/components/enterprise/EntityTimeline";
import { UpcomingMeetingsWidget, OpenTasksWidget } from "@/components/enterprise/EntityUpcomingWidgets";
import { MetricStrip } from "@/components/common/MetricStrip";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EmailTimeline } from "@/components/integrations/EmailTimeline";
import { EventModal } from "@/components/integrations/EventModal";
import { AddTaskDialog } from "@/components/common/AddTaskDialog";
import { UploadEntityDocumentDialog } from "@/components/common/UploadEntityDocumentDialog";
import { useToastContext } from "@/app/(app)/AppProviders";
import { stagePillClasses } from "@/lib/stage-pills";
import type { ContactOverview } from "@/app/api/contacts/[id]/overview/route";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building2 },
  { id: "deals", label: "Deals", icon: Briefcase },
  { id: "meetings", label: "Meetings", icon: CalendarPlus },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "timeline", label: "Timeline", icon: TrendingUp },
];

/** Common buyer-persona roles shown in the inline role selector. */
const CONTACT_ROLES = [
  "Decision Maker",
  "Economic Buyer",
  "Champion",
  "Influencer",
  "Technical Buyer",
  "End User",
  "Executive Sponsor",
  "Gatekeeper",
  "Coach",
];

const moneyFmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [overview, setOverview] = useState<ContactOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);

  const fetchOverview = useCallback(async (): Promise<ContactOverview> => {
    const res = await fetch(`/api/contacts/${id}/overview`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load contact");
    return res.json() as Promise<ContactOverview>;
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

  const contact = overview?.contact;
  const company = overview?.company;
  const metrics = overview?.metrics;

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

  const fullName = useMemo(
    () => (contact ? `${contact.firstName} ${contact.lastName}`.trim() : ""),
    [contact]
  );

  const handleRoleChange = useCallback(
    async (role: string) => {
      if (!contact) return;
      setRoleSaving(true);
      try {
        const res = await fetch(`/api/contacts/${contact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        if (!res.ok) throw new Error("Failed to update role");
        success("Role updated", `${fullName}'s role is now ${role}.`);
        await reload();
      } catch (err) {
        showError("Error", err instanceof Error ? err.message : "Failed to update role.");
      } finally {
        setRoleSaving(false);
      }
    },
    [contact, fullName, success, showError, reload]
  );

  const isArchived = !!contact?.status && contact.status !== "Active";

  if (loading && !overview) {
    return (
      <div className="space-y-5">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (!contact || !overview || !metrics) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <User className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Contact not found.</p>
        <Button variant="outline" onClick={() => router.push("/contacts")}>
          Back to Contacts
        </Button>
      </div>
    );
  }

  const initials = `${contact.firstName[0] ?? ""}${contact.lastName[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border bg-surface-raised">
        <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
          <Link
            href="/contacts"
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-info-soft text-lg font-bold text-[color:var(--info)]">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{fullName}</h1>
              {contact.role && (
                <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-950/60 dark:text-purple-300">
                  {contact.role}
                </span>
              )}
              {contact.status && <EntityStatusBadge label={contact.status} />}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {[contact.position, contact.company].filter(Boolean).join(" · ") || "No position on file"}
              {company ? ` · ${company.city}${company.country ? `, ${company.country}` : ""}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)} disabled={!contact.email}>
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Email
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEventOpen(true)}>
              <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
              Add Meeting
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)} disabled={!contact.companyId}>
              <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
              Add Task
            </Button>
            <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)} disabled={!contact.companyId}>
              <FileUp className="mr-1.5 h-3.5 w-3.5" />
              Upload
            </Button>
            <Button
              size="sm"
              disabled={!contact.companyId}
              onClick={() => router.push(`/opportunities?companyId=${encodeURIComponent(contact.companyId ?? "")}`)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Opportunity
            </Button>
          </div>
        </div>

        <EntityTabs tabs={TABS} active={activeTab} onChange={setActiveTab} id="contact360" />
      </div>

      {/* Panels */}
      <div id={`contact360-panel-${activeTab}`} role="tabpanel" aria-labelledby={`contact360-tab-${activeTab}`} className="space-y-5">
        {activeTab === "profile" && (
          <>
            <MetricStrip
              items={[
                { label: "Deals", value: metrics.dealsCount, icon: Briefcase },
                { label: "Open Deals", value: metrics.openDeals, icon: TrendingUp },
                { label: "Pipeline", value: moneyFmt(metrics.pipelineValue), icon: DollarSign, tone: "--chart-1" },
                { label: "Won Revenue", value: moneyFmt(metrics.wonRevenue), icon: TrendingUp, tone: "--success" },
                { label: "Documents", value: metrics.documentsCount, icon: FileText },
                { label: "Activities", value: metrics.activitiesCount, icon: StickyNote, tone: "--warning" },
              ]}
            />

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-1">
                <section className="rounded-xl border bg-surface-raised">
                  <div className="border-b px-4 py-2.5">
                    <h3 className="text-sm font-semibold text-foreground">Contact Details</h3>
                  </div>
                  <dl className="divide-y text-sm">
                    <FieldRow label="Email">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-[color:var(--primary)] hover:underline">
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </FieldRow>
                    <FieldRow label="Phone">
                      {contact.phone ? (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-[color:var(--primary)] hover:underline">
                          <Phone className="h-3 w-3" /> {contact.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </FieldRow>
                    <FieldRow label="Position">{contact.position || <span className="text-muted-foreground">—</span>}</FieldRow>
                    <FieldRow label="Company">
                      {company ? (
                        <Link href={`/companies/${company.id}`} className="flex items-center gap-1.5 text-[color:var(--primary)] hover:underline">
                          <Building2 className="h-3 w-3" /> {company.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </FieldRow>
                    <FieldRow label="Location">
                      {[contact.city, contact.country].filter(Boolean).join(", ") || <span className="text-muted-foreground">—</span>}
                    </FieldRow>
                    <FieldRow label="Role">
                      <span className="flex items-center gap-2">
                        <select
                          value={contact.role || ""}
                          onChange={(e) => void handleRoleChange(e.target.value)}
                          disabled={roleSaving || isArchived}
                          aria-label="Contact role"
                          className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        >
                          <option value="">No role</option>
                          {CONTACT_ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                          {contact.role && !CONTACT_ROLES.includes(contact.role) && (
                            <option value={contact.role}>{contact.role}</option>
                          )}
                        </select>
                        {roleSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      </span>
                    </FieldRow>
                  </dl>
                  {contact.notes && (
                    <div className="border-t px-4 py-3">
                      <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Notes</p>
                      <p className="text-sm whitespace-pre-wrap text-foreground">{contact.notes}</p>
                    </div>
                  )}
                  {contact.tags.length > 0 && (
                    <div className="border-t px-4 py-3">
                      <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {contact.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="space-y-5 lg:col-span-2">
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

                <div className="grid gap-5 md:grid-cols-2">
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
                      owner: t.owner,
                    }))}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "company" && (
          <section className="rounded-xl border bg-surface-raised">
            {!company ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                This contact is not linked to a company yet.
              </p>
            ) : (
              <div className="divide-y">
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info-soft text-base font-bold text-[color:var(--info)]">
                    {company.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground">{company.name}</h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {[company.industry, company.city, company.country].filter(Boolean).join(" · ") || "No industry on file"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/companies/${company.id}`)}>
                    Open Company 360
                  </Button>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <CompanyStat label="Website" value={company.website || "—"} href={company.website || undefined} />
                  <CompanyStat label="Phone" value={company.phone || "—"} />
                  <CompanyStat label="Employees" value={company.employeeCount ? String(company.employeeCount) : "—"} />
                  <CompanyStat label="Status" value={company.status || "—"} />
                </div>

                <div className="border-t px-4 py-3">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    Teammates at {company.name}
                    {overview.relatedContacts.length > 0 && <span className="ml-1 text-muted-foreground">({overview.relatedContacts.length})</span>}
                  </h4>
                  {overview.relatedContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No other contacts at this company.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {overview.relatedContacts.map((c) => (
                        <Link
                          key={c.id}
                          href={`/contacts/${c.id}`}
                          className="flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-info-soft text-[10px] font-semibold text-[color:var(--info)]">
                            {`${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{c.firstName} {c.lastName}</span>
                            <span className="block truncate text-xs text-muted-foreground">{c.role || c.position || "—"}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "deals" && (
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">
                Deals {company ? `at ${company.name}` : ""} ({overview.deals.length})
              </h3>
              {company && (
                <Button size="sm" variant="outline" onClick={() => router.push(`/opportunities?companyId=${encodeURIComponent(company.id)}`)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New Opportunity
                </Button>
              )}
            </div>
            {overview.deals.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">No deals yet.</p>
            ) : (
              <div className="divide-y">
                {overview.deals.map((o) => (
                  <Link
                    key={o.id}
                    href={`/opportunities?record=${encodeURIComponent(o.id)}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{o.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {o.customer || "No customer"}
                        {o.expectedCloseDate ? ` · Closes ${new Date(o.expectedCloseDate).toLocaleDateString()}` : ""}
                      </span>
                    </span>
                    <span className="hidden text-sm font-semibold text-foreground tabular-nums sm:inline">{moneyFmt(o.value ?? 0)}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${stagePillClasses(o.stage)}`}>
                      {o.stage}
                    </span>
                  </Link>
                ))}
              </div>
            )}
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

        {activeTab === "tasks" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <OpenTasksWidget
              tasks={overview.openTasks.map((t) => ({
                id: t.id,
                subject: t.subject,
                dueDate: t.date ? new Date(`${t.date}T${t.time || "00:00"}`).toISOString() : "",
                status: t.status,
                owner: t.owner,
              }))}
            />
            <section className="rounded-xl border bg-surface-raised">
              <div className="border-b px-4 py-2.5">
                <h3 className="text-sm font-semibold text-foreground">Recent Tasks</h3>
              </div>
              {overview.activities.filter((a) => a.type === "Task").length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">No tasks recorded.</p>
              ) : (
                <div className="divide-y">
                  {overview.activities
                    .filter((a) => a.type === "Task")
                    .slice(0, 10)
                    .map((t) => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{t.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.date ? new Date(`${t.date}T${t.time || "00:00"}`).toLocaleString() : "No due date"}
                            {t.owner ? ` · ${t.owner}` : ""}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {t.status}
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
            <EmailTimeline entityEmail={contact.email || undefined} entityName={fullName} />
          </section>
        )}

        {activeTab === "documents" && (
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <h3 className="text-sm font-semibold text-foreground">Documents ({overview.documents.length})</h3>
              <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)} disabled={!contact.companyId}>
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
        to={contact.email ? [{ name: fullName, email: contact.email }] : []}
        subject=""
      />
      <EventModal open={eventOpen} onClose={() => setEventOpen(false)} entityType="contact" entityId={contact.id} />
      <AddTaskDialog
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        entityKind="company"
        entityId={contact.companyId ?? ""}
        onCreated={() => void reload()}
      />
      <UploadEntityDocumentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        entityKind="company"
        entityId={contact.companyId ?? ""}
        entityLabel={company?.name ?? fullName}
        onUploaded={() => void reload()}
      />
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5">
      <dt className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-foreground">{children}</dd>
    </div>
  );
}

function CompanyStat({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-sm font-medium text-[color:var(--primary)] hover:underline">
          {value}
        </a>
      ) : (
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
      )}
    </div>
  );
}

function SkeletonRow() {
  return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
}
