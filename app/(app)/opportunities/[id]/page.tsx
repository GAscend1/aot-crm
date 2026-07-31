"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Archive, FileText, Receipt, Mail, Calendar, Video, UserRound, Briefcase } from "lucide-react";
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
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !opportunity) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

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
                <DetailField label="Priority" value={
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[opportunity.priority ?? "Medium"] || ""}`}>
                    {opportunity.priority ?? "Medium"}
                  </span>
                } />
              </DetailGrid>
            </DetailSection>

            <DetailSection title="Financials">
              <DetailGrid>
                <DetailField label="Expected Revenue" value={`$${(opportunity.value ?? 0).toLocaleString()}`} />
                <DetailField label="Probability" value={`${opportunity.probability}%`} />
                <DetailField label="Expected Close" value={opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toLocaleDateString() : "-"} />
                <DetailField label="Status" value={opportunity.status} />
              </DetailGrid>
            </DetailSection>

            {opportunity.notes && (
              <DetailSection title="Notes">
                <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{opportunity.notes}</p>
              </DetailSection>
            )}

            <DetailSection title="Activity Timeline">
              <div className="space-y-3">
                {["created", "updated"].map((a) => (
                  <div key={a} className="flex gap-3 text-sm">
                    <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${a === "created" ? "bg-green-500" : "bg-blue-500"}`} />
                    <div>
                      <p className="capitalize font-medium text-slate-900 dark:text-white">{a}</p>
                      <p className="text-xs text-slate-500">
                        {a === "created"
                          ? new Date(opportunity.createdAt).toLocaleString()
                          : new Date(opportunity.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          </div>

          <div className="space-y-6">
            <DetailSection title="Status">
              <DetailField label="Stage" value={
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColors[opportunity.stage] || ""}`}>
                  {opportunity.stage}
                </span>
              } />
              <div className="mt-4">
                <DetailField label="Status" value={
                  <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {opportunity.status}
                  </span>
                } />
              </div>
              <div className="mt-4">
                <DetailField label="Created" value={new Date(opportunity.createdAt).toLocaleString()} />
              </div>
              <div className="mt-4">
                <DetailField label="Updated" value={new Date(opportunity.updatedAt).toLocaleString()} />
              </div>
            </DetailSection>

            <SectionCard title="Quick Actions">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push(`/quotes?opportunityId=${opportunity.id}`)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  Create Quote
                </button>
                <button
                  onClick={() => router.push(`/quotes`)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  View Quotes
                </button>
                <button
                  onClick={() => router.push(`/invoices?opportunityId=${opportunity.id}`)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  Create Invoice
                </button>
                <button
                  onClick={() => router.push(`/invoices`)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Receipt className="h-4 w-4 text-slate-500" />
                  View Invoices
                </button>
                <button
                  onClick={() => setAssignOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <UserRound className="h-4 w-4 text-purple-600" />
                  Assign
                </button>
                <button
                  onClick={() => setEmailOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Mail className="h-4 w-4" />
                  Email Customer
                </button>
                <button
                  onClick={() => setTeamsOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Video className="h-4 w-4" />
                  Teams Meeting
                </button>
                <button
                  onClick={() => setEventOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
                </button>
                <button
                  onClick={() => void handleArchive()}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors dark:border-slate-700"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Quick Links">
              <div className="flex flex-col gap-2">
                <Link href="/opportunities/kanban" className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700">
                  <Briefcase className="h-4 w-4" />
                  Open Pipeline
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      </DetailView>

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
