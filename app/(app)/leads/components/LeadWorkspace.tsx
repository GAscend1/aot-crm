"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Copy,
  ExternalLink,
  ListTodo,
  Mail,
  Pencil,
  Repeat,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntityStatusBadge } from "@/components/enterprise/EntityStatusBadge";
import {
  RecordQuickActions,
  RecordWorkspace,
  RecordWorkspaceField,
  RecordWorkspaceGrid,
  RecordWorkspaceSection,
  useRecordWorkspace,
} from "@/components/enterprise/RecordWorkspace";
import { ActivityComposer } from "@/components/common/ActivityComposer";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { useToastContext } from "@/app/(app)/AppProviders";
import { leadService } from "@/services/index";

import type { Lead } from "../types";
import { LeadDrawer } from "./LeadDrawer";
import { AssignLeadDialog } from "./AssignLeadDialog";
import { ConvertLeadDialog } from "./ConvertLeadDialog";
import { LeadDeleteDialog } from "./LeadDeleteDialog";

interface LeadWorkspaceProps {
  onChanged?: () => void;
}

export function LeadWorkspace({ onChanged }: LeadWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, open, close, reload } =
    useRecordWorkspace(leadService);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const handleSave = async (data: Lead) => {
    if (!record) return;
    try {
      await leadService.update(record.id, data as Partial<Lead>);
      success("Lead updated", `${data.title} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save lead.");
    }
  };

  const handleFavorite = async () => {
    if (!record) return;
    try {
      const res = await fetch(`/api/leads/${record.id}/favorite`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      showError("Error", "Could not update favorite.");
    } finally {
      reload();
    }
  };

  const handleDuplicate = async () => {
    if (!record) return;
    try {
      const res = await fetch(`/api/leads/${record.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to duplicate lead");
      const created = (await res.json()) as { id: string };
      success("Lead duplicated", `Opened copy of "${record.title}".`);
      onChanged?.();
      open(created.id);
    } catch {
      showError("Error", "Could not duplicate lead.");
    }
  };

  const handleArchive = async () => {
    if (!record) return;
    try {
      const res = await fetch(`/api/leads/${record.id}/archive`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to archive lead");
      success("Lead archived", `${record.title} has been archived.`);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Could not archive lead.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await leadService.delete(record.id);
      success("Lead deleted");
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to delete lead.");
    }
  };

  const quickActions = useMemo(
    () => [
      {
        label: "Send Email",
        icon: Mail,
        onClick: () => setEmailOpen(true),
      },
      {
        label: "Assign Lead",
        icon: UserRound,
        onClick: () => setAssignOpen(true),
      },
      {
        label: "Convert to Customer",
        icon: Repeat,
        onClick: () => setConvertOpen(true),
      },
      {
        label: "Add Activity",
        icon: ListTodo,
        onClick: () => {
          document
            .getElementById("lead-workspace-activity")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      },
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            router.push(`/leads/${record.id}`);
          }
        },
      },
    ],
    [record, router, close]
  );

  const sidebarActions = [
    {
      label: "Duplicate",
      icon: Copy,
      onClick: () => void handleDuplicate(),
    },
    {
      label: "Archive",
      icon: Archive,
      onClick: () => void handleArchive(),
    },
    {
      label: "Delete",
      icon: Trash2,
      destructive: true,
      onClick: () => setDeleteOpen(true),
    },
  ];

  return (
    <>
      <RecordWorkspace
        open={recordId !== null}
        onClose={close}
        loading={loading}
        title={record?.title ?? "Lead"}
        eyebrow="Lead"
        subtitle={record?.company}
        badge={
          record?.status ? (
            <EntityStatusBadge label={record.status} />
          ) : undefined
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void handleFavorite()}
              aria-label={record?.isFavorite ? "Unstar lead" : "Star lead"}
            >
              <Star
                className={record?.isFavorite ? "fill-amber-400 text-amber-400" : ""}
              />
            </Button>
          </>
        }
        sidebar={
          <>
            <RecordQuickActions actions={quickActions} />
            <RecordWorkspaceSection title="More Actions">
              <div className="flex flex-col gap-1.5">
                {sidebarActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        action.destructive
                          ? "border-danger/25 text-[color:var(--danger)] hover:bg-danger-soft"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </RecordWorkspaceSection>
          </>
        }
      >
        <RecordWorkspaceSection title="Details">
          <RecordWorkspaceGrid>
            <RecordWorkspaceField label="Contact" value={record?.contactName} />
            <RecordWorkspaceField
              label="Email"
              value={
                record?.email ? (
                  <a
                    href={`mailto:${record.email}`}
                    className="text-[color:var(--primary)] hover:underline"
                  >
                    {record.email}
                  </a>
                ) : undefined
              }
            />
            <RecordWorkspaceField label="Phone" value={record?.phone} />
            <RecordWorkspaceField label="Source" value={record?.source} />
            <RecordWorkspaceField
              label="Owner"
              value={record?.owner ?? "Unassigned"}
            />
            <RecordWorkspaceField label="Score" value={record?.score} />
            <RecordWorkspaceField
              label="Probability"
              value={record?.probability != null ? `${record.probability}%` : undefined}
            />
            <RecordWorkspaceField
              label="Expected Revenue"
              value={
                record?.expectedRevenue != null
                  ? `$${record.expectedRevenue.toLocaleString()}`
                  : undefined
              }
            />
            <RecordWorkspaceField
              label="Expected Close"
              value={
                record?.expectedCloseDate
                  ? new Date(record.expectedCloseDate).toLocaleDateString()
                  : undefined
              }
            />
          </RecordWorkspaceGrid>
        </RecordWorkspaceSection>

        <RecordWorkspaceSection title="Notes">
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {record?.notes || "No notes added yet."}
          </p>
        </RecordWorkspaceSection>

        {record?.tags && record.tags.length > 0 && (
          <RecordWorkspaceSection title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {record.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </RecordWorkspaceSection>
        )}

        <RecordWorkspaceSection
          title="Add Activity"
          actions={
            <span className="text-xs text-muted-foreground">
              Log calls, emails, tasks, and notes
            </span>
          }
        >
          <div id="lead-workspace-activity">
            <ActivityComposer
              entityType="lead"
              entityId={record?.id}
              onCreated={reload}
            />
          </div>
        </RecordWorkspaceSection>

        <RecordWorkspaceSection title="Timestamps">
          <RecordWorkspaceGrid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
            <RecordWorkspaceField
              label="Created"
              value={
                record?.createdAt
                  ? new Date(record.createdAt).toLocaleString()
                  : undefined
              }
            />
            <RecordWorkspaceField
              label="Updated"
              value={
                record?.updatedAt
                  ? new Date(record.updatedAt).toLocaleString()
                  : undefined
              }
            />
          </RecordWorkspaceGrid>
        </RecordWorkspaceSection>
      </RecordWorkspace>

      {record && (
        <>
          <LeadDrawer
            open={editOpen}
            onOpenChange={(openState) => {
              setEditOpen(openState);
              if (!openState) {
                reload();
              }
            }}
            lead={record}
            onSave={(data) => void handleSave(data)}
          />
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: record.contactName, email: record.email }]}
            subject=""
          />
          <AssignLeadDialog
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            leadId={record.id}
            leadTitle={record.title}
            currentOwnerId={record.ownerId}
            onAssigned={() => {
              onChanged?.();
              reload();
            }}
          />
          <ConvertLeadDialog
            open={convertOpen}
            onClose={() => setConvertOpen(false)}
            leadId={record.id}
            leadTitle={record.title}
            onConverted={(opportunityId) => {
              onChanged?.();
              close();
              if (opportunityId) {
                router.push(`/opportunities/${opportunityId}`);
              } else {
                router.push("/customers");
              }
            }}
          />
          <LeadDeleteDialog
            open={deleteOpen}
            lead={record}
            onConfirm={() => void handleDelete()}
            onCancel={() => setDeleteOpen(false)}
          />
        </>
      )}
    </>
  );
}
