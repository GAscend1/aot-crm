"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  ListTodo,
  MessageSquare,
  Paperclip,
  Pencil,
  Trash2,
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
import { useToastContext } from "@/app/(app)/AppProviders";
import { ticketService } from "@/services/index";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import type { Ticket } from "../types";
import { TicketModal } from "./TicketModal";

interface TicketWorkspaceProps {
  onChanged?: () => void;
}

export function TicketWorkspace({ onChanged }: TicketWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(ticketService);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSave = async (data: Ticket) => {
    if (!record) return;
    try {
      await ticketService.update(record.id, data as Partial<Ticket>);
      success("Ticket updated", `${data.subject} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save ticket.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await ticketService.delete(record.id);
      success("Ticket deleted");
      setDeleteOpen(false);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to delete ticket.");
    }
  };

  const quickActions = useMemo(
    () => [
      {
        label: "Add Activity",
        icon: ListTodo,
        onClick: () => {
          document
            .getElementById("ticket-workspace-activity")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      },
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            router.push(`/tickets/${record.id}`);
          }
        },
      },
    ],
    [record, router, close]
  );

  return (
    <>
      <RecordWorkspace
        open={recordId !== null}
        onClose={close}
        loading={loading}
        title={record?.subject ?? "Ticket"}
        eyebrow="Ticket"
        subtitle={record?.requester}
        badge={
          record?.status ? (
            <EntityStatusBadge label={record.status} />
          ) : undefined
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </Button>
        }
        sidebar={
          <RecordQuickActions
            actions={[
              ...quickActions,
              {
                label: "Delete",
                icon: Trash2,
                destructive: true,
                onClick: () => setDeleteOpen(true),
              },
            ]}
          />
        }
      >
        <RecordWorkspaceSection title="Details">
          <RecordWorkspaceGrid>
            <RecordWorkspaceField label="Priority" value={record?.priority} />
            <RecordWorkspaceField label="SLA" value={record?.sla} />
            <RecordWorkspaceField label="Assignee" value={record?.assignee} />
            <RecordWorkspaceField label="Requester" value={record?.requester} />
            <RecordWorkspaceField label="Department" value={record?.department} />
            <RecordWorkspaceField
              label="Comments"
              value={
                record?.comments != null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    {record.comments}
                  </span>
                ) : undefined
              }
            />
            <RecordWorkspaceField
              label="Attachments"
              value={
                record?.attachments != null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    {record.attachments}
                  </span>
                ) : undefined
              }
            />
          </RecordWorkspaceGrid>
        </RecordWorkspaceSection>

        <RecordWorkspaceSection title="Description">
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {record?.description || "No description provided."}
          </p>
        </RecordWorkspaceSection>

        <RecordWorkspaceSection title="Add Activity">
          <div id="ticket-workspace-activity">
            <ActivityComposer
              entityType="ticket"
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
          <TicketModal
            open={editOpen}
            onClose={() => {
              setEditOpen(false);
              reload();
            }}
            ticket={record}
            onSave={(data) => void handleSave(data)}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Delete Ticket"
            message={
              <>
                Are you sure you want to delete <strong>{record.subject}</strong>?
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
