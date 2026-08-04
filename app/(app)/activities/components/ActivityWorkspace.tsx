"use client";

import { useState } from "react";
import {
  Ban,
  Bell,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ListTodo,
  Mail,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
import { useToastContext } from "@/app/(app)/AppProviders";
import { activityService } from "@/services/index";
import { ActivityModal } from "./ActivityModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import type { Activity } from "../types";

const typeIcons: Record<string, LucideIcon> = {
  Meeting: Calendar,
  Call: Phone,
  Email: Mail,
  Task: CheckSquare,
  Note: ListTodo,
  Comment: ListTodo,
  Reminder: Bell,
};

interface ActivityWorkspaceProps {
  onChanged?: () => void;
}

export function ActivityWorkspace({ onChanged }: ActivityWorkspaceProps) {
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(activityService);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const Icon = record?.type ? typeIcons[record.type] ?? ListTodo : ListTodo;

  const handleSave = async (data: Activity) => {
    if (!record) return;
    try {
      const res = await fetch(`/api/activities/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          subject: data.subject,
          description: data.description || undefined,
          status: data.status,
          dueDate: data.date && data.time ? `${data.date}T${data.time}:00` : data.date || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      success("Activity updated", `${data.subject} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save activity.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await activityService.delete(record.id);
      success("Activity deleted");
      setDeleteOpen(false);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to delete activity.");
    }
  };

  const setStatus = async (status: Activity["status"], label: string) => {
    if (!record) return;
    try {
      await activityService.update(record.id, { status } as Partial<Activity>);
      success("Activity updated", `${record.subject} marked ${label}.`);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Could not update activity.");
    }
  };

  return (
    <>
      <RecordWorkspace
        open={recordId !== null}
        onClose={close}
        loading={loading}
        title={record?.subject ?? "Activity"}
        eyebrow="Activity"
        subtitle={
          record
            ? [record.date, record.time].filter(Boolean).join(" · ")
            : undefined
        }
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
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete activity"
            >
              <Trash2 />
            </Button>
          </>
        }
        sidebar={
          <RecordQuickActions
            actions={[
              {
                label: "Edit Activity",
                icon: Pencil,
                onClick: () => setEditOpen(true),
              },
              {
                label: "Mark Completed",
                icon: CheckCircle2,
                disabled: record?.status === "Completed",
                onClick: () => void setStatus("Completed", "Completed"),
              },
              {
                label: "Mark Cancelled",
                icon: Ban,
                destructive: true,
                disabled: record?.status === "Cancelled" || record?.status === "Completed",
                onClick: () => void setStatus("Cancelled", "Cancelled"),
              },
            ]}
          />
        }
      >
        <RecordWorkspaceSection title="Details">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-[color:var(--info)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-foreground">
              {record?.type ?? "Activity"}
            </span>
          </div>
          <RecordWorkspaceGrid>
            <RecordWorkspaceField
              label="Date"
              value={
                record?.date
                  ? new Date(record.date).toLocaleDateString()
                  : undefined
              }
            />
            <RecordWorkspaceField label="Time" value={record?.time} />
            <RecordWorkspaceField label="Owner" value={record?.owner} />
            <RecordWorkspaceField
              label="Related To"
              value={
                record?.relatedTo
                  ? `${record.relatedType ? `${record.relatedType}: ` : ""}${record.relatedTo}`
                  : undefined
              }
            />
            <RecordWorkspaceField label="Reminder" value={record?.reminder} />
          </RecordWorkspaceGrid>
        </RecordWorkspaceSection>

        <RecordWorkspaceSection title="Description">
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {record?.description || "No description provided."}
          </p>
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
          <ActivityModal
            open={editOpen}
            onClose={() => {
              setEditOpen(false);
              reload();
            }}
            activity={record}
            onSave={(data) => void handleSave(data)}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Delete Activity"
            message={
              <>
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">{record.subject}</span>?
                This action cannot be undone.
              </>
            }
            confirmLabel="Delete"
            variant="danger"
            onConfirm={() => void handleDelete()}
          />
        </>
      )}
    </>
  );
}
