"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Calendar,
  ExternalLink,
  ListTodo,
  Mail,
  Pencil,
  Phone,
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ApiRequestError } from "@/repositories/api/ApiRepository";

import type { Customer } from "../types";
import { CustomerForm } from "./CustomerForm";

interface CustomerWorkspaceProps {
  onChanged?: () => void;
}

export function CustomerWorkspace({ onChanged }: CustomerWorkspaceProps) {
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(customerService);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSave = useCallback(
    async (data: Partial<Customer>) => {
      if (!record) return;
      try {
        const updated = await customerService.update(record.id, data);
        success("Customer updated", `${updated.name} has been updated.`);
        setEditing(false);
        onChanged?.();
        reload();
      } catch (err) {
        if (err instanceof ApiRequestError) throw err;
        showError("Error", "Failed to save customer.");
        throw new ApiRequestError(500, "Failed to save customer.");
      }
    },
    [record, success, showError, onChanged, reload]
  );

  const handleDelete = useCallback(async () => {
    if (!record) return;
    setDeleting(true);
    try {
      await customerService.delete(record.id);
      success("Customer archived", `${record.name} has been archived.`);
      setDeleteOpen(false);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to archive customer.");
    } finally {
      setDeleting(false);
    }
  }, [record, success, showError, onChanged, close]);

  const actionBar = useMemo(
    () => [
      {
        label: "Email",
        icon: Mail,
        tone: "--info",
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
        label: "Schedule",
        icon: Calendar,
        tone: "--chart-3",
        onClick: () => setEventOpen(true),
      },
      {
        label: "Add Activity",
        icon: ListTodo,
        tone: "--success",
        onClick: () => {
          document
            .getElementById("customer-workspace-activity")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
      },
    ],
    [record]
  );

  const moreActions = useMemo(
    () => [
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            window.location.href = `/customers/${record.id}`;
          }
        },
      },
      {
        label: "Archive Customer",
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
        title={record?.name ?? "Customer"}
        eyebrow="Customer"
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
            <CustomerForm
              customer={record}
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

          <RecordWorkspaceSection title="Notes">
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {record?.notes || "No notes added yet."}
            </p>
          </RecordWorkspaceSection>

          <RelatedOpportunitiesList customerId={record?.id} limit={3} />

          <RelatedQuotesList customerId={record?.id} limit={3} />

          <RelatedInvoicesList customerId={record?.id} limit={3} />

          <RelatedActivitiesList customerId={record?.id} limit={3} refreshKey={refreshKey} />

          <RecordWorkspaceSection title="Add Activity">
            <div id="customer-workspace-activity">
              <ActivityComposer
                entityType="customer"
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
            to={[{ name: record.name, email: record.email }]}
            subject=""
          />
          <EventModal
            open={eventOpen}
            onClose={() => setEventOpen(false)}
            entityType="customer"
            entityId={record.id}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Archive Customer"
            message={
              <>
                Archive <strong>{record.name}</strong>? This will remove the
                customer from active lists while keeping linked records intact.
              </>
            }
            confirmLabel="Archive Customer"
            variant="danger"
            loading={deleting}
            onConfirm={() => void handleDelete()}
          />
        </>
      )}
    </>
  );
}
