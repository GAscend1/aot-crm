"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
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
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EventModal } from "@/components/integrations/EventModal";
import { useToastContext } from "@/app/(app)/AppProviders";
import { contactService } from "@/services/index";

import type { Contact } from "../types";
import { ContactDrawer } from "./ContactDrawer";
import { ContactDeleteDialog } from "./ContactDeleteDialog";

interface ContactWorkspaceProps {
  onChanged?: () => void;
}

export function ContactWorkspace({ onChanged }: ContactWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(contactService);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  const fullName = useMemo(
    () =>
      record
        ? [record.firstName, record.lastName].filter(Boolean).join(" ")
        : "",
    [record]
  );

  const handleSave = async (data: Partial<Contact>) => {
    if (!record) return;
    try {
      await contactService.update(record.id, data);
      success("Contact updated", `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() + " has been updated.");
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save contact.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await contactService.delete(record.id);
      success("Contact deleted");
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to delete contact.");
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
        label: "Call",
        icon: Phone,
        disabled: !record?.phone,
        onClick: () => {
          if (record?.phone) window.location.href = `tel:${record.phone}`;
        },
      },
      {
        label: "Schedule Meeting",
        icon: Calendar,
        onClick: () => setEventOpen(true),
      },
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            router.push(`/contacts/${record.id}`);
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
        title={fullName || "Contact"}
        eyebrow="Contact"
        subtitle={record?.position}
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

        <RecordWorkspaceSection title="Notes">
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {record?.notes || "No notes added yet."}
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
          <ContactDrawer
            open={editOpen}
            onOpenChange={(openState) => {
              setEditOpen(openState);
              if (!openState) reload();
            }}
            contact={record}
            onSave={(data) => void handleSave(data)}
          />
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
          <ContactDeleteDialog
            open={deleteOpen}
            onOpenChange={(openState) => {
              setDeleteOpen(openState);
              if (!openState) reload();
            }}
            contact={record}
            onConfirm={() => void handleDelete()}
          />
        </>
      )}
    </>
  );
}
