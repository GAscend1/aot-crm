"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
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

import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EventModal } from "@/components/integrations/EventModal";
import { useToastContext } from "@/app/(app)/AppProviders";
import { contactService } from "@/services/index";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ApiRequestError } from "@/repositories/api/ApiRepository";
import { useCanUse } from "@/hooks/use-subscription";

import type { Contact } from "../types";
import { ContactForm } from "./ContactForm";

interface ContactWorkspaceProps {
  onChanged?: () => void;
}

export function ContactWorkspace({ onChanged }: ContactWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(contactService);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  const canEmail = useCanUse("outlook_email");

  const fullName = useMemo(
    () =>
      record
        ? [record.firstName, record.lastName].filter(Boolean).join(" ")
        : "",
    [record]
  );

  const handleSave = useCallback(
    async (data: Partial<Contact>) => {
      if (!record) return;
      try {
        const updated = await contactService.update(record.id, data);
        success(
          "Contact updated",
          `${updated.firstName} ${updated.lastName}`.trim() + " has been updated."
        );
        setEditing(false);
        onChanged?.();
        reload();
      } catch (err) {
        if (err instanceof ApiRequestError) throw err;
        showError("Error", "Failed to save contact.");
        throw new ApiRequestError(500, "Failed to save contact.");
      }
    },
    [record, success, showError, onChanged, reload]
  );

  const handleDelete = useCallback(async () => {
    if (!record) return;
    setDeleting(true);
    try {
      await contactService.delete(record.id);
      success("Contact archived", `${fullName} has been archived.`);
      setDeleteOpen(false);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to archive contact.");
    } finally {
      setDeleting(false);
    }
  }, [record, fullName, success, showError, onChanged, close]);

  const handleCreateOpportunity = useCallback(() => {
    if (!record) return;
    close();
    router.push(`/opportunities?contactId=${encodeURIComponent(record.id)}`);
  }, [record, close, router]);

  const actionBar = useMemo(
    () => [
      ...(canEmail
        ? [
            {
              label: "Email",
              icon: Mail,
              tone: "--info" as const,
              onClick: () => setEmailOpen(true),
            },
          ]
        : []),
      {
        label: "Call",
        icon: Phone,
        disabled: !record?.phone,
        onClick: () => {
          if (record?.phone) window.location.href = `tel:${record.phone}`;
        },
      },
      {
        label: "Schedule",
        icon: Calendar,
        tone: "--chart-3",
        onClick: () => setEventOpen(true),
      },
      {
        label: "Create Opportunity",
        icon: Plus,
        tone: "--success",
        onClick: handleCreateOpportunity,
      },
    ],
    [record, canEmail, handleCreateOpportunity]
  );

  const moreActions = useMemo(
    () => [
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            window.location.href = `/contacts/${record.id}`;
          }
        },
      },
      {
        label: "Archive Contact",
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteOpen(true),
      },
    ],
    [record, close]
  );

  return (
    <>
      <RecordWorkspace
        open={recordId !== null}
        onClose={close}
        loading={loading}
        title={fullName || "Contact"}
        eyebrow="Person"
        subtitle={record?.position}
        badge={
          record?.status ? (
            <EntityStatusBadge label={record.status} />
          ) : undefined
        }
        editing={editing}
        keepHeaderWhileEditing
        editor={
          record ? (
            <ContactForm
              contact={record}
              onSave={handleSave}
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
            <RecordMoreMenu actions={moreActions} />
          </>
        }
        layout="split"
        sidebar={
          <div className="flex h-full flex-col gap-4 p-4 lg:w-72 lg:p-5">
            <RecordWorkspaceSection title="Inspector">
              <div className="space-y-3">
                <RecordWorkspaceField label="Company" value={record?.company} />
                <RecordWorkspaceField label="Status" value={record?.status} />
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
            <RecordWorkspaceSection title="Contact Details">
              <RecordWorkspaceGrid>
                <RecordWorkspaceField label="Position" value={record?.position} />
                <RecordWorkspaceField label="Company" value={record?.company} />
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
                <RecordWorkspaceField label="Country" value={record?.country} />
                <RecordWorkspaceField label="City" value={record?.city} />
              </RecordWorkspaceGrid>
            </RecordWorkspaceSection>

            <RecordWorkspaceSection title="Notes">
              <p className="text-sm whitespace-pre-wrap text-foreground">
                {record?.notes || "No notes added yet."}
              </p>
            </RecordWorkspaceSection>


          </div>
        </div>
      </RecordWorkspace>

      {record && (
        <>
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: fullName, email: record.email }]}
            subject=""
          />
          <EventModal
            open={eventOpen}
            onClose={() => setEventOpen(false)}
            entityType="contact"
            entityId={record.id}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Archive Contact"
            message={
              <>
                Archive <strong>{fullName}</strong>? This will remove the
                contact from active lists while keeping linked records intact.
              </>
            }
            confirmLabel="Archive Contact"
            variant="danger"
            loading={deleting}
            onConfirm={() => void handleDelete()}
          />
        </>
      )}
    </>
  );
}
