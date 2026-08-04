"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  FileText,
  Receipt,
  Mail,
  Calendar,
  Video,
  UserRound,
  Briefcase,
  FileUp,
  FolderOpen,
  ClipboardList,
  Pencil,
} from "lucide-react";
import { DetailView, DetailSection, DetailField, DetailGrid } from "@/components/enterprise/DetailView";
import { SectionCard } from "@/components/common/SectionCard";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EventModal } from "@/components/integrations/EventModal";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";
import { useToastContext } from "@/app/(app)/AppProviders";
import { opportunityService } from "@/services/index";
import type { Opportunity } from "@/services/opportunity.service";
import { AssignOpportunityDialog } from "../components/AssignOpportunityDialog";
import { CreateQuoteModal } from "../components/CreateQuoteModal";
import { UploadDocumentDialog } from "../components/UploadDocumentDialog";
import { AddActivityDialog } from "../components/AddActivityDialog";
import { EditOpportunityDialog } from "../components/EditOpportunityDialog";
import { OpportunityTimeline } from "../components/OpportunityTimeline";
import {
  RelatedQuotesSection,
  RelatedInvoicesSection,
  RelatedDocumentsSection,
  RelatedActivitiesSection,
} from "../components/OpportunityRelatedSections";
import type { Opportunity as ModuleOpportunity } from "../types";

const stageColors: Record<string, string> = {
  Qualification: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Discovery: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Proposal: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "Closed Won": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "Closed Lost": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  High: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const documentsRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    opportunityService.findById(id).then((data) => {
      if (data) {
        setOpportunity(data);
        setLoading(false);
      } else {
        router.replace("/opportunities");
      }
    });
  }, [id, router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleArchive = async () => {
    if (!opportunity) return;
    try {
      await opportunityService.delete(opportunity.id);
      success("Opportunity archived", `${opportunity.title} has been archived.`);
      router.push("/opportunities");
    } catch {
      showError("Error", "Could not archive opportunity.");
    }
  };

  const scrollToDocuments = () => {
    documentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading || !opportunity) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const moduleOpportunity: ModuleOpportunity = {
    id: opportunity.id,
    title: opportunity.title,
    customer: opportunity.customer,
    value: opportunity.value,
    stage: opportunity.stage,
    probability: opportunity.probability,
    expectedCloseDate: opportunity.expectedCloseDate,
    owner: opportunity.owner,
    notes: opportunity.notes,
    status: opportunity.status,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
  };

  const actionButton =
    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700";

  return (
    <>
      <DetailView
        title={opportunity.title}
        description={`${opportunity.customer} · ${opportunity.stage}`}
        backHref="/opportunities"
        actions={
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColors[opportunity.stage] || ""}`}>
              {opportunity.stage}
            </span>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DetailSection title="Overview">
              <DetailGrid>
                <DetailField label="Customer" value={opportunity.customer || "-"} />
                <DetailField label="Company" value={opportunity.company || "-"} />
                <DetailField label="Contact" value={opportunity.contact || "-"} />
                <DetailField label="Lead Source" value={opportunity.leadSource || "-"} />
                <DetailField label="Owner" value={opportunity.owner || "Unassigned"} />
                <DetailField
                  label="Priority"
                  value={
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[opportunity.priority ?? "Medium"] || ""}`}>
                      {opportunity.priority ?? "Medium"}
                    </span>
                  }
                />
              </DetailGrid>
            </DetailSection>

            <DetailSection title="Financials">
              <DetailGrid>
                <DetailField label="Expected Revenue" value={`$${(opportunity.value ?? 0).toLocaleString()}`} />
                <DetailField label="Probability" value={`${opportunity.probability}%`} />
                <DetailField
                  label="Expected Close"
                  value={opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toLocaleDateString() : "-"}
                />
                <DetailField label="Status" value={opportunity.status} />
              </DetailGrid>
            </DetailSection>

            {opportunity.notes && (
              <DetailSection title="Notes">
                <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{opportunity.notes}</p>
              </DetailSection>
            )}

            <DetailSection title="Related Quotes">
              <RelatedQuotesSection opportunityId={opportunity.id} refreshKey={refreshKey} />
            </DetailSection>

            <DetailSection title="Related Invoices">
              <RelatedInvoicesSection opportunityId={opportunity.id} refreshKey={refreshKey} />
            </DetailSection>

            <div ref={documentsRef} className="scroll-mt-24">
              <DetailSection title="Related Documents">
                <RelatedDocumentsSection opportunityId={opportunity.id} refreshKey={refreshKey} />
              </DetailSection>
            </div>

            <DetailSection title="Related Activities">
              <RelatedActivitiesSection opportunityId={opportunity.id} refreshKey={refreshKey} />
            </DetailSection>

            <DetailSection title="Timeline">
              <OpportunityTimeline opportunityId={opportunity.id} refreshKey={refreshKey} />
            </DetailSection>
          </div>

          <div className="space-y-6">
            <DetailSection title="Status">
              <DetailField
                label="Stage"
                value={
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColors[opportunity.stage] || ""}`}>
                    {opportunity.stage}
                  </span>
                }
              />
              <div className="mt-4">
                <DetailField
                  label="Status"
                  value={
                    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {opportunity.status}
                    </span>
                  }
                />
              </div>
              <div className="mt-4">
                <DetailField label="Created" value={new Date(opportunity.createdAt).toLocaleString()} />
              </div>
              <div className="mt-4">
                <DetailField label="Updated" value={new Date(opportunity.updatedAt).toLocaleString()} />
              </div>
            </DetailSection>

            <SectionCard title="Quick Actions">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setQuoteModalOpen(true)} className={`${actionButton} text-blue-600`}>
                  <FileText className="h-4 w-4" />
                  Create Quote
                </button>
                <button onClick={() => router.push(`/quotes?opportunityId=${opportunity.id}`)} className={actionButton}>
                  <FileText className="h-4 w-4 text-slate-500" />
                  View Quotes
                </button>
                <button onClick={() => router.push(`/invoices?opportunityId=${opportunity.id}`)} className={`${actionButton} text-emerald-600`}>
                  <Receipt className="h-4 w-4" />
                  Create Invoice
                </button>
                <button onClick={() => router.push(`/invoices?opportunityId=${opportunity.id}`)} className={actionButton}>
                  <Receipt className="h-4 w-4 text-slate-500" />
                  View Invoices
                </button>
                <button onClick={() => setUploadOpen(true)} className={`${actionButton} text-sky-600`}>
                  <FileUp className="h-4 w-4" />
                  Upload Document
                </button>
                <button onClick={scrollToDocuments} className={actionButton}>
                  <FolderOpen className="h-4 w-4 text-slate-500" />
                  View Documents
                </button>
                <button onClick={() => setActivityOpen(true)} className={`${actionButton} text-purple-600`}>
                  <ClipboardList className="h-4 w-4" />
                  Add Activity
                </button>
                <button onClick={() => setEditOpen(true)} className={actionButton}>
                  <Pencil className="h-4 w-4 text-slate-500" />
                  Edit Opportunity
                </button>
                <button onClick={() => setAssignOpen(true)} className={actionButton}>
                  <UserRound className="h-4 w-4 text-purple-600" />
                  Assign
                </button>
                <button onClick={() => setEmailOpen(true)} className={actionButton}>
                  <Mail className="h-4 w-4" />
                  Email Customer
                </button>
                <button onClick={() => setTeamsOpen(true)} className={actionButton}>
                  <Video className="h-4 w-4" />
                  Teams Meeting
                </button>
                <button onClick={() => setEventOpen(true)} className={actionButton}>
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
                </button>
                <button onClick={() => void handleArchive()} className={`${actionButton} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40`}>
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Quick Links">
              <div className="flex flex-col gap-2">
                <Link href="/opportunities?view=kanban" className={`${actionButton}`}>
                  <Briefcase className="h-4 w-4" />
                  Open Pipeline
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      </DetailView>

      <CreateQuoteModal
        open={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        opportunity={opportunity}
        onCreated={bumpRefresh}
      />
      <UploadDocumentDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        opportunityId={opportunity.id}
        opportunityTitle={opportunity.title}
        onUploaded={bumpRefresh}
      />
      <AddActivityDialog
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        opportunityId={opportunity.id}
        onAdded={bumpRefresh}
      />
      <EditOpportunityDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        opportunity={moduleOpportunity}
        onSaved={() => {
          refresh();
          bumpRefresh();
        }}
      />
      <EmailComposer
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        to={[{ name: opportunity.customer, email: "" }]}
        subject={`Opportunity: ${opportunity.title}`}
      />
      <EventModal open={eventOpen} onClose={() => setEventOpen(false)} entityType="opportunity" entityId={opportunity.id} />
      <TeamsMeetingDialog open={teamsOpen} onClose={() => setTeamsOpen(false)} entityName={opportunity.title} />
      <ZoomMeetingDialog open={zoomOpen} onClose={() => setZoomOpen(false)} entityName={opportunity.title} />
      <AssignOpportunityDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        opportunityId={opportunity.id}
        opportunityTitle={opportunity.title}
        currentOwnerId={opportunity.ownerId}
        onAssigned={refresh}
      />
    </>
  );
}
