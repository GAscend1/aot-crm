"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MoreHorizontal, Mail, UserRound, Copy, Repeat, Trash2, Pencil, ListTodo, History, FileUp, Bell, Info, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DetailField, DetailGrid, DetailSection } from "@/components/enterprise/DetailView";
import { TagInput } from "@/components/enterprise/TagInput";
import { SectionCard } from "@/components/common/SectionCard";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToastContext } from "@/app/(app)/AppProviders";
import { leadService } from "@/services/index";
import type { Lead } from "../types";
import { LeadModal } from "../components/LeadModal";
import { AssignLeadDialog } from "../components/AssignLeadDialog";
import { ConvertLeadDialog } from "../components/ConvertLeadDialog";
import { LeadHistoryTab } from "../components/LeadHistoryTab";
import { LeadActivitiesTab } from "../components/LeadActivitiesTab";
import { LeadDocumentsTab } from "../components/LeadDocumentsTab";
import { LeadRemindersTab } from "../components/LeadRemindersTab";

const statusColors: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Contacted: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Qualified: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Proposal: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  Negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "Closed Won": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "Closed Lost": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Converted: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  Disqualified: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

type TabKey = "details" | "history" | "activities" | "documents" | "reminders";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "details", label: "Details", icon: Info },
  { key: "history", label: "History", icon: History },
  { key: "activities", label: "Activities", icon: ListTodo },
  { key: "documents", label: "Documents", icon: FileUp },
  { key: "reminders", label: "Reminders", icon: Bell },
];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: showError } = useToastContext();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("details");
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    leadService
      .findById(id)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          router.replace("/leads");
          return;
        }
        setLead(result);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          showError("Error", "Failed to load lead.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, router, showError]);

  const handleFavorite = async () => {
    if (!lead) return;
    const next = !lead.isFavorite;
    setLead({ ...lead, isFavorite: next });
    try {
      const res = await fetch(`/api/leads/${lead.id}/favorite`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setLead({ ...lead, isFavorite: !next });
      showError("Error", "Could not update favorite.");
    }
  };

  const handleDuplicate = async () => {
    if (!lead) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to duplicate lead");
      const created = (await res.json()) as { id: string };
      success("Lead duplicated", `Opened copy of "${lead.title}".`);
      router.push(`/leads/${created.id}`);
    } catch {
      showError("Error", "Could not duplicate lead.");
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    try {
      await leadService.delete(lead.id);
      success("Lead archived", `${lead.title} has been archived.`);
      router.replace("/leads");
    } catch {
      showError("Error", "Failed to archive lead.");
    }
  };

  const handleEditSave = async (data: Lead) => {
    try {
      const updated = await leadService.update(lead!.id, {
        title: data.title,
        contactName: data.contactName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        source: data.source,
        status: data.status,
        probability: data.probability,
        expectedRevenue: data.expectedRevenue,
        notes: data.notes,
      } as Partial<Lead>);
      setLead(updated);
      success("Lead updated");
      setEditOpen(false);
    } catch {
      showError("Error", "Failed to update lead.");
    }
  };

  const handleTagsChange = async (tags: string[]) => {
    if (!lead) return;
    const previous = lead;
    const current = lead.tags ?? [];
    setLead({ ...lead, tags });
    try {
      const added = tags.filter((t) => !current.includes(t));
      const removed = current.filter((t) => !tags.includes(t));
      for (const tag of added) {
        const res = await fetch(`/api/leads/${lead.id}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag }),
        });
        if (!res.ok) throw new Error("Failed");
      }
      for (const tag of removed) {
        const res = await fetch(`/api/leads/${lead.id}/tags`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag }),
        });
        if (!res.ok) throw new Error("Failed");
      }
    } catch {
      setLead(previous);
      showError("Error", "Could not update tags.");
    }
  };

  const handleArchive = async () => {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}/archive`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to archive lead");
      success("Lead archived", `${lead.title} has been archived.`);
      router.replace("/leads");
    } catch {
      showError("Error", "Could not archive lead.");
    }
  };

  const handleConverted = (opportunityId?: string) => {
    if (opportunityId) {
      router.push(`/opportunities/${opportunityId}`);
    } else {
      // Canonical destination: Customers is a view of the Contacts module.
      router.push("/contacts?view=customers");
    }
  };

  if (loading || !lead) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/leads"
            className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lead.title}
              </h1>
              {lead.status && (
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[lead.status] || ""}`}>
                  {lead.status}
                </span>
              )}
            </div>
            {lead.company && <p className="text-sm text-slate-500">{lead.company}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEmailOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline" onClick={() => setAssignOpen(true)}>
            <UserRound className="mr-2 h-4 w-4" />
            Assign
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFavorite} title={lead.isFavorite ? "Unstar" : "Star"}>
            <Star className={`h-4 w-4 ${lead.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void handleDuplicate()} disabled={duplicating}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConvertOpen(true)}>
                <Repeat className="mr-2 h-4 w-4" />
                Convert
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleArchive()}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b dark:border-slate-800">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DetailSection title="Details">
              <DetailGrid>
                <DetailField label="Contact" value={lead.contactName || "-"} />
                <DetailField
                  label="Email"
                  value={
                    lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline dark:text-blue-400">
                        {lead.email}
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
                <DetailField label="Phone" value={lead.phone || "-"} />
                <DetailField label="Source" value={lead.source || "-"} />
                <DetailField label="Owner" value={lead.owner || "Unassigned"} />
                <DetailField label="Score" value={lead.score} />
                <DetailField label="Probability" value={`${lead.probability}%`} />
                <DetailField label="Expected Revenue" value={`$${lead.expectedRevenue.toLocaleString()}`} />
                <DetailField label="Expected Close" value={lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toLocaleDateString() : "-"} />
              </DetailGrid>
            </DetailSection>

            <DetailSection title="Notes">
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {lead.notes || "No notes added yet."}
              </p>
            </DetailSection>

            <DetailSection title="Tags">
              <TagInput
                tags={lead.tags ?? []}
                onChange={handleTagsChange}
                suggestions={["enterprise", "tech", "saas", "startup", "hot", "follow-up"]}
              />
            </DetailSection>

            {lead.convertedAt && (
              <DetailSection title="Conversion">
                <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                  Converted on {new Date(lead.convertedAt).toLocaleDateString()}. The
                  original lead is retained here for history — navigate to the
                  records created from it:
                </p>
                <div className="flex flex-col items-start gap-1.5">
                  {lead.convertedContactId && (
                    <Link
                      href={`/contacts/${lead.convertedContactId}`}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View linked contact
                    </Link>
                  )}
                  {lead.convertedCustomerId && (
                    <Link
                      href={`/contacts?view=customers&record=${encodeURIComponent(lead.convertedCustomerId)}`}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View linked customer
                    </Link>
                  )}
                  {lead.convertedOpportunityId && (
                    <Link
                      href={`/opportunities/${lead.convertedOpportunityId}`}
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View linked opportunity
                    </Link>
                  )}
                </div>
              </DetailSection>
            )}
          </div>

          <div className="space-y-6">
            <SectionCard title="Quick Actions">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setEmailOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
                <button
                  onClick={() => {
                    setTab("activities");
                  }}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 transition-colors"
                >
                  <ListTodo className="h-4 w-4" />
                  Add Task
                </button>
                <button
                  onClick={() => setAssignOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 transition-colors"
                >
                  <UserRound className="h-4 w-4" />
                  Assign Lead
                </button>
              </div>
            </SectionCard>

            <DetailSection title="Timestamps">
              <DetailField label="Created" value={new Date(lead.createdAt).toLocaleString()} />
              <div className="mt-4">
                <DetailField label="Updated" value={new Date(lead.updatedAt).toLocaleString()} />
              </div>
            </DetailSection>
          </div>
        </div>
      )}

      {tab === "history" && <LeadHistoryTab leadId={lead.id} />}
      {tab === "activities" && <LeadActivitiesTab leadId={lead.id} />}
      {tab === "documents" && <LeadDocumentsTab leadId={lead.id} />}
      {tab === "reminders" && <LeadRemindersTab leadId={lead.id} />}

      {lead && (
        <>
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: lead.contactName, email: lead.email }]}
            subject=""
          />
          <AssignLeadDialog
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            leadId={lead.id}
            leadTitle={lead.title}
            currentOwnerId={lead.ownerId}
            onAssigned={() => {
              leadService.findById(lead.id).then((updated) => updated && setLead(updated));
            }}
          />
          <ConvertLeadDialog
            open={convertOpen}
            onClose={() => setConvertOpen(false)}
            leadId={lead.id}
            leadTitle={lead.title}
            onConverted={handleConverted}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Archive Lead"
            message={
              <>
                Archive <strong>{lead.title}</strong>? This will remove the lead
                from active lists while keeping related records intact.
              </>
            }
            confirmLabel="Archive Lead"
            variant="danger"
            onConfirm={() => void handleDelete()}
          />

          <LeadModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            lead={lead}
            onSave={handleEditSave}
          />
        </>
      )}
    </>
  );
}
