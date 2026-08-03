"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  ListTodo,
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
import {
  RelatedActivitiesList,
  RelatedInvoicesList,
  RelatedOpportunitiesList,
  RelatedQuotesList,
} from "@/components/enterprise/RelatedEntityLists";
import { ActivityComposer } from "@/components/common/ActivityComposer";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EventModal } from "@/components/integrations/EventModal";
import { useToastContext } from "@/app/(app)/AppProviders";
import { customerService } from "@/services/index";

import type { Customer } from "../types";
import { CustomerDrawer } from "./CustomerDrawer";
import { CustomerDeleteDialog } from "./CustomerDeleteDialog";

interface CustomerWorkspaceProps {
  onChanged?: () => void;
}

export function CustomerWorkspace({ onChanged }: CustomerWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(customerService);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSave = async (data: Partial<Customer>) => {
    if (!record) return;
    try {
      await customerService.update(record.id, data);
      success("Customer updated", `${data.name ?? record.name} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save customer.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await customerService.delete(record.id);
      success("Customer deleted");
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to delete customer.");
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
        label: "Add Activity",
        icon: ListTodo,
        onClick: () => {
          document
            .getElementById("customer-workspace-activity")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      },
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            router.push(`/customers/${record.id}`);
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
        title={record?.name ?? "Customer"}
        eyebrow="Customer"
        subtitle={record?.company}
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
            <RecordWorkspaceField label="Company" value={record?.company} />
            <RecordWorkspaceField label="Position" value={record?.position} />
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

        <RelatedOpportunitiesList customerId={record?.id} />

        <RelatedQuotesList customerId={record?.id} />

        <RelatedInvoicesList customerId={record?.id} />

        <RelatedActivitiesList customerId={record?.id} refreshKey={refreshKey} />

        <RecordWorkspaceSection title="Add Activity">
          <div id="customer-workspace-activity">
            <ActivityComposer
              entityType="customer"
              entityId={record?.id}
              onCreated={() => setRefreshKey((k) => k + 1)}
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
          <CustomerDrawer
            open={editOpen}
            onOpenChange={(openState) => {
              setEditOpen(openState);
              if (!openState) reload();
            }}
            customer={record}
            onSave={(data) => void handleSave(data)}
          />
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: record.name, email: record.email }]}
            subject=""
          />
          <EventModal
            open={eventOpen}
            onClose={() => setEventOpen(false)}
            entityType="customer"
            entityId={record.id}
          />
          <CustomerDeleteDialog
            open={deleteOpen}
            onOpenChange={(openState) => {
              setDeleteOpen(openState);
              if (!openState) reload();
            }}
            customer={record}
            onConfirm={() => void handleDelete()}
          />
        </>
      )}
    </>
  );
}
