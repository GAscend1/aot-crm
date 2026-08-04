"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Archive,
  Copy,
  ExternalLink,
  ListTodo,
  Mail,
  Pencil,
  Repeat,
  Star,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EntityStatusBadge } from "@/components/enterprise/EntityStatusBadge";
import {
  RecordActionBar,
  RecordMoreMenu,
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ApiRequestError } from "@/repositories/api/ApiRepository";

import type { Lead } from "../types";
import { LeadForm } from "./LeadForm";
import { AssignLeadDialog } from "./AssignLeadDialog";
import { ConvertLeadDialog } from "./ConvertLeadDialog";

interface LeadWorkspaceProps {
  onChanged?: () => void;
}

export function LeadWorkspace({ onChanged }: LeadWorkspaceProps) {
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, open, close, reload } =
    useRecordWorkspace(leadService);

  const [editing, setEditing] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [, setRefreshKey] = useState(0);

  const isConverted = useMemo(
    () => !!record?.convertedAt || !!record?.convertedOpportunityId,
    [record]
  );

  const handleSave = useCallback(
    async (data: Lead) => {
      if (!record) return;
      try {
        const updated = await leadService.update(record.id, data as Partial<Lead>);
        success("Lead updated", `${updated.title} has been updated.`);
        setEditing(false);
        onChanged?.();
        reload();
      } catch (err) {
        if (err instanceof ApiRequestError) throw err;
        showError("Error", "Failed to save lead.");
        throw new ApiRequestError(500, "Failed to save lead.");
      }
    },
    [record, success, showError, onChanged, reload]
  );

  const handleFavorite = useCallback(async () => {
    if (!record) return;
    try {
      const res = await fetch(`/api/leads/${record.id}/favorite`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
    } catch {
      showError("Error", "Could not update favorite.");
    } finally {
      reload();
    }
  }, [record, showError, reload]);

  const handleDuplicate = useCallback(async () => {
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
  }, [record, success, showError, onChanged, open]);

  const handleArchive = useCallback(async () => {
    if (!record) return;
    setDeleting(true);
    try {
      await leadService.delete(record.id);
      success("Lead archived", `${record.title} has been archived.`);
      setDeleteOpen(false);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Could not archive lead.");
    } finally {
      setDeleting(false);
    }
  }, [record, success, showError, onChanged, close]);

  const actionBar = useMemo(
    () => [
      {
        label: "Convert",
        icon: Repeat,
        tone: "--success",
        disabled: isConverted,
        onClick: () => setConvertOpen(true),
      },
      {
        label: "Assign",
        icon: UserRound,
        tone: "--chart-4",
        onClick: () => setAssignOpen(true),
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
        label: "Email",
        icon: Mail,
        tone: "--info",
        onClick: () => setEmailOpen(true),
      },
    ],
    [isConverted]
  );

  const moreActions = useMemo(
    () => [
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            window.location.href = `/leads/${record.id}`;
          }
        },
      },
      {
        label: "Duplicate",
        icon: Copy,
        onClick: () => void handleDuplicate(),
      },
      {
        label: "Archive Lead",
        icon: Archive,
        destructive: true,
        onClick: () => setDeleteOpen(true),
      },
    ],
    [record, close, handleDuplicate]
  );

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
        editing={editing}
        keepHeaderWhileEditing
        editor={
          record ? (
            <LeadForm
              initialData={record}
              onSubmit={handleSave}
              onCancel={() => setEditing(false)}
            />
          ) : undefined
        }
        editingActions={
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
            <X />
            Cancel
          </Button>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
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
            <RecordMoreMenu actions={moreActions} />
          </>
        }
        layout="split"
        sidebar={
          <div className="flex h-full flex-col gap-4 p-4 lg:w-72 lg:p-5">
            <RecordWorkspaceSection title="Inspector">
              <div className="space-y-3">
                <RecordWorkspaceField label="Owner" value={record?.owner || "Unassigned"} />
                <RecordWorkspaceField label="Source" value={record?.source} />
                <RecordWorkspaceField label="Score" value={record?.score} />
                <RecordWorkspaceField
                  label="Expected Revenue"
                  value={
                    record?.expectedRevenue != null
                      ? `$${record.expectedRevenue.toLocaleString()}`
                      : undefined
                  }
                />
                {isConverted && (
                  <div className="rounded-lg bg-success-soft px-3 py-2">
                    <p className="text-xs font-semibold text-[color:var(--success)]">
                      Converted
                    </p>
                    {record?.convertedOpportunityId && (
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          window.location.href = `/opportunities/${record.convertedOpportunityId}`;
                        }}
                        className="mt-1 text-xs font-medium text-[color:var(--primary)] hover:underline"
                      >
                        View linked opportunity
                      </button>
                    )}
                  </div>
                )}
                {record?.tags && record.tags.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Tags
                    </p>
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
                  </div>
                )}
              </div>
            </RecordWorkspaceSection>
            <RecordWorkspaceSection title="Timestamps">
              <div className="space-y-3">
                <RecordWorkspaceField
                  label="Created"
                  value={
                    record?.createdAt
                      ? new Date(record.createdAt).toLocaleDateString()
                      : undefined
                  }
                />
                <RecordWorkspaceField
                  label="Updated"
                  value={
                    record?.updatedAt
                      ? new Date(record.updatedAt).toLocaleDateString()
                      : undefined
                  }
                />
              </div>
            </RecordWorkspaceSection>
          </div>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <RecordActionBar actions={actionBar} />

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <RecordWorkspaceSection title="Qualification">
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
                <RecordWorkspaceField
                  label="Probability"
                  value={
                    record?.probability != null
                      ? `${record.probability}%`
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
                  onCreated={() => setRefreshKey((k) => k + 1)}
                />
              </div>
            </RecordWorkspaceSection>
          </div>
        </div>
      </RecordWorkspace>

      {record && (
        <>
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
                window.location.href = `/opportunities/${opportunityId}`;
              }
            }}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Archive Lead"
            message={
              <>
                Archive <strong>{record.title}</strong>? This will remove the lead
                from active lists while keeping related records intact.
              </>
            }
            confirmLabel="Archive Lead"
            variant="danger"
            loading={deleting}
            onConfirm={() => void handleArchive()}
          />
        </>
      )}
    </>
  );
}
