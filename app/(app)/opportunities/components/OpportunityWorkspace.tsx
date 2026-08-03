"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  Calendar,
  CheckSquare,
  Mail,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { RecordWorkspace, useRecordWorkspace } from "@/components/enterprise/RecordWorkspace";
import { ActivityComposer } from "@/components/common/ActivityComposer";
import { useToastContext } from "@/app/(app)/AppProviders";
import { opportunityService } from "@/services/index";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EventModal } from "@/components/integrations/EventModal";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";
import { cn } from "@/lib/utils";

import type { Opportunity } from "@/services/opportunity.service";
import { isOpportunityStage, type OpportunityStage } from "../stageConfig";
import { OpportunityWorkspaceHeader } from "./OpportunityWorkspaceHeader";
import { OpportunityTimeline, type TimelineFilter } from "./OpportunityTimeline";
import { useOpportunityFavorite } from "./useOpportunityFavorite";
import {
  RelatedDocumentsSection,
  RelatedInvoicesSection,
  RelatedQuotesSection,
} from "./OpportunityRelatedSections";
import { CreateQuoteModal } from "./CreateQuoteModal";
import { CreateInvoiceModal } from "./CreateInvoiceModal";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { AddActivityDialog } from "./AddActivityDialog";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { AssignOpportunityDialog } from "./AssignOpportunityDialog";
import { OpportunityDeleteDialog } from "./OpportunityDeleteDialog";

interface OpportunityWorkspaceProps {
  onChanged?: () => void;
  /** Ordered list of visible opportunities used for prev/next navigation. */
  siblings?: { id: string; title: string }[];
}

const moneyFmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const tagToneClasses: Record<string, string> = {
  warning: "bg-warning-soft text-[color:var(--warning)] ring-1 ring-inset ring-warning/25",
  neutral: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  info: "bg-info-soft text-[color:var(--info)] ring-1 ring-inset ring-info/25",
  danger: "bg-danger-soft text-[color:var(--danger)] ring-1 ring-inset ring-danger/25",
  success: "bg-success-soft text-[color:var(--success)] ring-1 ring-inset ring-success/25",
};

function InspectorGroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{children}</p>
  );
}

function InspectorField({ label, value }: { label: string; value?: ReactNode }) {
  const title = typeof value === "string" ? value : undefined;
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <div className="mt-0.5 truncate text-[13px] text-foreground" title={title}>
        {value ?? "—"}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feed tabs                                                           */
/* ------------------------------------------------------------------ */

const FEED_TABS: { id: TimelineFilter; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Activity", icon: Activity },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "meetings", label: "Meetings", icon: Calendar },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
];

function FeedTabs({
  active,
  onChange,
  id,
}: {
  active: TimelineFilter;
  onChange: (tab: TimelineFilter) => void;
  id?: string;
}) {
  const tablistId = id ?? "feed-tabs";
  return (
    <div
      role="tablist"
      aria-label="Activity feed"
      id={tablistId}
      className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border px-3 sm:px-4"
    >
      {FEED_TABS.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.id;
        const panelId = `${tablistId}-panel-${tab.id}`;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={panelId}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {tab.label}
            <span
              className={cn(
                "absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[color:var(--info)] transition-opacity duration-150",
                selected ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customer summary panel                                              */
/* ------------------------------------------------------------------ */

function CustomerSummary({
  record,
  onCollapse,
}: {
  record: Opportunity;
  onCollapse: () => void;
}) {
  const parts = (record.customer ?? "").split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || "—";
  const hasPhone = !!record.customerPhone;

  return (
    <div className="shrink-0 border-b border-border bg-muted/25 px-3 py-3 sm:px-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info-soft text-sm font-semibold text-[color:var(--info)]">
            {firstName.slice(0, 1).toUpperCase() || "?"}
            {lastName !== "—" ? lastName.slice(0, 1).toUpperCase() : ""}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {firstName} {lastName !== "—" ? lastName : ""}
            </p>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {record.customerPhone ? (
                <a href={`tel:${record.customerPhone}`} className="inline-flex items-center gap-1 hover:text-[color:var(--info)] hover:underline">
                  <Phone className="size-3" aria-hidden="true" />
                  {record.customerPhone}
                </a>
              ) : null}
              {record.customerEmail ? (
                <a href={`mailto:${record.customerEmail}`} className="inline-flex min-w-0 items-center gap-1 truncate hover:text-[color:var(--info)] hover:underline">
                  <Mail className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{record.customerEmail}</span>
                </a>
              ) : null}
              {!hasPhone && !record.customerEmail && (
                <span className="text-xs text-muted-foreground">No contact details on file.</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasPhone ? (
            <a
              href={`tel:${record.customerPhone}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[color:var(--chart-1)]/[0.12] px-2.5 text-xs font-semibold text-[color:var(--chart-1)] ring-1 ring-inset ring-[color:var(--chart-1)]/25 transition-colors hover:bg-[color:var(--chart-1)]/[0.2] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              Call
            </a>
          ) : (
            <span className="inline-flex h-8 items-center rounded-lg bg-muted px-2.5 text-[11px] font-medium text-muted-foreground">
              No phone number available
            </span>
          )}
          <button
            type="button"
            onClick={onCollapse}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Collapse customer summary"
            title="Collapse customer summary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inspector tabs                                                      */
/* ------------------------------------------------------------------ */

type InspectorTab = "details" | "history";

function InspectorTabs({
  active,
  onChange,
}: {
  active: InspectorTab;
  onChange: (tab: InspectorTab) => void;
}) {
  const tabs: { id: InspectorTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "history", label: "History" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Inspector"
      id="inspector-tabs"
      className="hidden shrink-0 items-center gap-1 border-b border-border bg-surface-raised px-3 pt-1.5 lg:flex"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls="inspector-tabpanel"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex h-9 items-center rounded-t-lg px-3 text-xs font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[color:var(--info)] transition-opacity duration-150",
                selected ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main workspace                                                      */
/* ------------------------------------------------------------------ */

export function OpportunityWorkspace({ onChanged, siblings }: OpportunityWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, open, close, reload } = useRecordWorkspace(opportunityService);

  const [stageDraft, setStageDraft] = useState<OpportunityStage | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceQuote, setInvoiceQuote] = useState<{
    id: string;
    quoteNumber: string;
    items: { name: string; description: string; quantity: number; unitPrice: number }[];
  } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const [feedTab, setFeedTab] = useState<TimelineFilter>("all");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("details");
  /** Mobile (< lg) view switcher: Workspace / Details / History. */
  const [mobileView, setMobileView] = useState<"workspace" | "details" | "history">("workspace");
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [converting, setConverting] = useState(false);

  const { favorite, toggle: toggleFavorite } = useOpportunityFavorite(record?.id);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const rawStage = stageDraft ?? record?.stage ?? "Discovery";
  const currentStage: OpportunityStage = isOpportunityStage(rawStage) ? rawStage : "Discovery";

  const handleStageSelect = useCallback(
    async (stage: OpportunityStage) => {
      if (!record || stage === (stageDraft ?? record.stage)) return;
      setStageDraft(stage);
      try {
        await opportunityService.update(record.id, { stage });
        success("Stage updated", `Moved to ${stage}.`);
        onChanged?.();
        bumpRefresh();
        reload();
      } catch {
        setStageDraft(null);
        showError("Update failed", "Could not change stage.");
      }
    },
    [record, stageDraft, success, showError, onChanged, bumpRefresh, reload]
  );

  const handleSave = async (data: Opportunity) => {
    if (!record) return;
    try {
      await opportunityService.update(record.id, data as Partial<Opportunity>);
      success("Opportunity updated", `${data.title} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save opportunity.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await opportunityService.delete(record.id);
      success("Opportunity archived", `${record.title} has been archived.`);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to archive opportunity.");
    }
  };

  const handleOpenFullPage = useCallback(() => {
    if (!record) return;
    close();
    router.push(`/opportunities/${record.id}`);
  }, [record, close, router]);

  const handleConvertQuote = useCallback(
    async (quoteId: string, quoteNumber: string) => {
      try {
        const res = await fetch(`/api/quotes/${quoteId}`, { cache: "no-store" });
        const body = (await res.json()) as {
          id?: string;
          quoteNumber?: string;
          items?: { name: string; description: string; quantity: number; unitPrice: number }[];
          error?: string;
        };
        if (!res.ok || !body.id) throw new Error(body?.error || "Could not load quote");
        setInvoiceQuote({
          id: body.id,
          quoteNumber: body.quoteNumber ?? quoteNumber,
          items: body.items ?? [],
        });
        setInvoiceOpen(true);
      } catch (err) {
        showError("Error", err instanceof Error ? err.message : "Could not load quote.");
      }
    },
    [showError]
  );

  /** Header "Convert" chip — converts the most recent ACCEPTED quote into an invoice. */
  const handleConvertHeader = useCallback(async () => {
    if (!record) return;
    setConverting(true);
    try {
      const res = await fetch(
        `/api/quotes?filters=${encodeURIComponent(JSON.stringify({ opportunityId: record.id }))}&pageSize=50`,
        { cache: "no-store" }
      );
      const body = (await res.json()) as {
        data?: { id: string; quoteNumber: string; status: string }[];
      };
      const accepted = (body.data ?? []).filter((q) => q.status === "ACCEPTED");
      if (accepted.length === 0) {
        showError("Nothing to convert", "Accept a quote first, then convert it to an invoice.");
        return;
      }
      await handleConvertQuote(accepted[0].id, accepted[0].quoteNumber);
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Could not load quotes.");
    } finally {
      setConverting(false);
    }
  }, [record, showError, handleConvertQuote]);

  const navIndex = siblings?.findIndex((s) => s.id === record?.id) ?? -1;
  const prevSibling = navIndex > 0 ? siblings?.[navIndex - 1] : undefined;
  const nextSibling = navIndex >= 0 && navIndex < (siblings?.length ?? 0) - 1 ? siblings?.[navIndex + 1] : undefined;

  const subtitle = record ? [record.customer, record.company, record.contact].filter(Boolean).join(" · ") : undefined;

  const overflowActions = [
    {
      label: "Edit Opportunity",
      icon: Pencil,
      onClick: () => setEditOpen(true),
    },
    {
      label: "Assign Owner",
      icon: UserRound,
      onClick: () => setAssignOpen(true),
    },
    {
      label: "Schedule Meeting",
      icon: Calendar,
      onClick: () => setEventOpen(true),
    },
    {
      label: "Email Customer",
      icon: Mail,
      onClick: () => setEmailOpen(true),
    },
    {
      label: "Teams Meeting",
      icon: Video,
      onClick: () => setTeamsOpen(true),
    },
    {
      label: "Archive",
      icon: Archive,
      onClick: () => void handleDelete(),
    },
    {
      label: "Delete",
      icon: Trash2,
      destructive: true,
      onClick: () => setDeleteOpen(true),
    },
  ];

  const initials = record?.customer
    ? record.customer
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const tags = [
    ...(record?.priority ? [{ label: record.priority, tone: "warning" as const }] : []),
    ...(record?.status ? [{ label: record.status, tone: "neutral" as const }] : []),
    ...(record?.leadSource ? [{ label: record.leadSource, tone: "info" as const }] : []),
  ];

  const handleRowMore = useCallback(
    () => {
      // Row overflow menu: open the full-page record view.
      handleOpenFullPage();
    },
    [handleOpenFullPage]
  );

  return (
    <>
      <RecordWorkspace
        open={recordId !== null}
        onClose={close}
        loading={loading}
        title={record?.title ?? "Opportunity"}
        layout="split"
        header={
          record ? (
            <OpportunityWorkspaceHeader
              title={record.title}
              subtitle={subtitle}
              stage={currentStage}
              onStageSelect={(stage) => void handleStageSelect(stage)}
              favorite={favorite}
              onToggleFavorite={toggleFavorite}
              value={record.value}
              probability={record.probability}
              phone={record.customerPhone}
              website={record.companyWebsite}
              expectedCloseDate={record.expectedCloseDate}
              canPrev={!!prevSibling}
              canNext={!!nextSibling}
              onPrev={() => prevSibling && open(prevSibling.id)}
              onNext={() => nextSibling && open(nextSibling.id)}
              onClose={close}
              onEdit={() => setEditOpen(true)}
              onEmail={() => setEmailOpen(true)}
              onTeams={() => setTeamsOpen(true)}
              onZoom={() => setZoomOpen(true)}
              onQuote={() => setQuoteOpen(true)}
              onInvoice={() => {
                setInvoiceQuote(null);
                setInvoiceOpen(true);
              }}
              onUpload={() => setUploadOpen(true)}
              onActivity={() => setActivityOpen(true)}
              onConvert={() => void handleConvertHeader()}
              onAssign={() => setAssignOpen(true)}
              onOpenFullPage={handleOpenFullPage}
              overflowActions={overflowActions}
              converting={converting}
            />
          ) : undefined
        }
      >
        {record && (
          <div className="flex h-full min-h-0 flex-col lg:flex-row">
            {/* Mobile view switcher (desktop shows both columns) */}
            <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface-raised px-3 pt-1.5 lg:hidden">
              {(
                [
                  { id: "workspace", label: "Workspace" },
                  { id: "details", label: "Details" },
                  { id: "history", label: "History" },
                ] as const
              ).map((view) => {
                const selected = mobileView === view.id;
                return (
                  <button
                    key={view.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setMobileView(view.id);
                      if (view.id === "details") setInspectorTab("details");
                      if (view.id === "history") setInspectorTab("history");
                    }}
                    className={cn(
                      "relative flex h-9 items-center rounded-t-lg px-3 text-xs font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      selected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {view.label}
                    <span
                      className={cn(
                        "absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[color:var(--info)] transition-opacity duration-150",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>

            {/* LEFT WORKSPACE — summary, tabs, feed, sticky composer */}
            <section
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col",
                mobileView !== "workspace" && "hidden lg:flex"
              )}
            >
              {!summaryCollapsed && <CustomerSummary record={record} onCollapse={() => setSummaryCollapsed(true)} />}

              <FeedTabs active={feedTab} onChange={setFeedTab} id="feed-tabs" />

              <div
                className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4"
                role="tabpanel"
                id="feed-tabs-panel-all"
                aria-labelledby="feed-tabs"
                tabIndex={0}
              >
                <OpportunityTimeline
                  opportunityId={record.id}
                  refreshKey={refreshKey}
                  compact
                  filter={feedTab}
                  onRowMore={handleRowMore}
                />
              </div>

              <div className="shrink-0 border-t border-border bg-popover/95 px-3 py-2.5 backdrop-blur-sm supports-[backdrop-filter]:bg-popover/85 sm:px-4">
                <ActivityComposer
                  entityType="opportunity"
                  entityId={record.id}
                  onCreated={bumpRefresh}
                  variant="bar"
                  onAttach={() => setUploadOpen(true)}
                />
              </div>
            </section>

            {/* RIGHT INSPECTOR — Details / History tabs, own scroll */}
            <aside
              className={cn(
                "flex min-h-0 w-full flex-col border-t border-border lg:w-[380px] lg:max-w-[380px] lg:shrink-0 lg:border-t-0 lg:border-l",
                mobileView === "workspace" && "hidden lg:flex"
              )}
            >
              <InspectorTabs active={inspectorTab} onChange={setInspectorTab} />

              <div
                className="min-h-0 flex-1 overflow-y-auto lg:bg-surface-raised"
                role="tabpanel"
                id="inspector-tabpanel"
                aria-labelledby="inspector-tabs"
                tabIndex={0}
              >
                {inspectorTab === "details" ? (
                  <div className="divide-y divide-border">
                    {/* OWNER */}
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-semibold text-[color:var(--info)]">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{record.owner || "Unassigned"}</p>
                          <p className="text-[10px] tracking-wider text-muted-foreground uppercase">Owner</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssignOpen(true)}
                        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2 text-xs font-medium text-[color:var(--chart-4)] transition-colors hover:bg-muted"
                      >
                        <UserRound className="size-3.5" />
                        Assign
                      </button>
                    </div>

                    {/* TAGS */}
                    <div className="px-4 py-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <InspectorGroupLabel>Tags</InspectorGroupLabel>
                        <button
                          type="button"
                          onClick={() => setEditOpen(true)}
                          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <Pencil className="size-3" />
                          Add tag
                        </button>
                      </div>
                      {tags.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No tags yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag) => (
                            <span
                              key={tag.label}
                              className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tagToneClasses[tag.tone])}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RELATED */}
                    <div className="px-4 py-3">
                      <InspectorGroupLabel>Related</InspectorGroupLabel>
                      <div className="space-y-3">
                        <RelatedDocumentsSection
                          opportunityId={record.id}
                          refreshKey={refreshKey}
                          compact
                          onUpload={() => setUploadOpen(true)}
                        />
                        <RelatedQuotesSection
                          opportunityId={record.id}
                          refreshKey={refreshKey}
                          compact
                          onConvert={handleConvertQuote}
                        />
                        <RelatedInvoicesSection opportunityId={record.id} refreshKey={refreshKey} compact />
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="px-4 py-3">
                      <InspectorGroupLabel>Details</InspectorGroupLabel>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                        <InspectorField label="Customer" value={record.customer} />
                        <InspectorField label="Company" value={record.company} />
                        <InspectorField label="Contact" value={record.contact} />
                        <InspectorField
                          label="Phone"
                          value={
                            record.customerPhone ? (
                              <a href={`tel:${record.customerPhone}`} className="text-[color:var(--info)] hover:underline">
                                {record.customerPhone}
                              </a>
                            ) : undefined
                          }
                        />
                        <InspectorField
                          label="Email"
                          value={
                            record.customerEmail ? (
                              <a href={`mailto:${record.customerEmail}`} className="truncate text-[color:var(--info)] hover:underline">
                                {record.customerEmail}
                              </a>
                            ) : undefined
                          }
                        />
                        <InspectorField label="Revenue" value={record.value != null ? moneyFmt(record.value) : undefined} />
                        <InspectorField label="Probability" value={record.probability != null ? `${record.probability}%` : undefined} />
                        <InspectorField label="Priority" value={record.priority || undefined} />
                        <InspectorField label="Lead Source" value={record.leadSource || undefined} />
                        <InspectorField label="Status" value={record.status || undefined} />
                        <InspectorField
                          label="Expected Close"
                          value={record.expectedCloseDate ? new Date(record.expectedCloseDate).toLocaleDateString() : undefined}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <OpportunityTimeline
                      opportunityId={record.id}
                      refreshKey={refreshKey}
                      compact
                      limit={15}
                      onRowMore={handleRowMore}
                    />
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </RecordWorkspace>

      {record && (
        <>
          <CreateQuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} opportunity={record} onCreated={bumpRefresh} />
          <CreateInvoiceModal
            open={invoiceOpen}
            onClose={() => setInvoiceOpen(false)}
            opportunity={record}
            quote={invoiceQuote}
            onCreated={bumpRefresh}
          />
          <UploadDocumentDialog
            open={uploadOpen}
            onClose={() => setUploadOpen(false)}
            opportunityId={record.id}
            opportunityTitle={record.title}
            onUploaded={bumpRefresh}
          />
          <AddActivityDialog
            open={activityOpen}
            onClose={() => setActivityOpen(false)}
            opportunityId={record.id}
            onAdded={bumpRefresh}
          />
          <OpportunityDrawer
            open={editOpen}
            onOpenChange={(openState) => {
              setEditOpen(openState);
              if (!openState) reload();
            }}
            opportunity={record}
            onSave={(data) => void handleSave(data)}
          />
          <AssignOpportunityDialog
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            opportunityId={record.id}
            opportunityTitle={record.title}
            currentOwnerId={record.ownerId}
            onAssigned={() => {
              onChanged?.();
              bumpRefresh();
              reload();
            }}
          />
          <OpportunityDeleteDialog
            open={deleteOpen}
            opportunity={record}
            onConfirm={() => void handleDelete()}
            onCancel={() => setDeleteOpen(false)}
          />
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: record.customer, email: record.customerEmail ?? "" }]}
            subject={`Opportunity: ${record.title}`}
          />
          <EventModal open={eventOpen} onClose={() => setEventOpen(false)} entityType="opportunity" entityId={record.id} />
          <TeamsMeetingDialog open={teamsOpen} onClose={() => setTeamsOpen(false)} entityName={record.title} />
          <ZoomMeetingDialog open={zoomOpen} onClose={() => setZoomOpen(false)} entityName={record.title} />
        </>
      )}
    </>
  );
}
