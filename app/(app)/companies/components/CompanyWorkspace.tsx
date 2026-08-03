"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Globe,
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
  RelatedContactsList,
  RelatedCustomersList,
  RelatedInvoicesList,
  RelatedOpportunitiesList,
  RelatedQuotesList,
} from "@/components/enterprise/RelatedEntityLists";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { useToastContext } from "@/app/(app)/AppProviders";
import { companyService } from "@/services/index";

import type { Company } from "../types";
import { CompanyDrawer } from "./CompanyDrawer";
import { CompanyDeleteDialog } from "./CompanyDeleteDialog";

interface CompanyWorkspaceProps {
  onChanged?: () => void;
}

export function CompanyWorkspace({ onChanged }: CompanyWorkspaceProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(companyService);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const handleSave = async (data: Company) => {
    if (!record) return;
    try {
      await companyService.update(record.id, data as Partial<Company>);
      success("Company updated", `${data.name} has been updated.`);
      setEditOpen(false);
      onChanged?.();
      reload();
    } catch {
      showError("Error", "Failed to save company.");
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    try {
      await companyService.delete(record.id);
      success("Company deleted");
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to delete company.");
    }
  };

  const quickActions = useMemo(
    () => [
      {
        label: "Send Email",
        icon: Mail,
        disabled: !record?.email,
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
        label: "Visit Website",
        icon: Globe,
        disabled: !record?.website,
        onClick: () => {
          if (record?.website) {
            window.open(
              record.website.startsWith("http") ? record.website : `https://${record.website}`,
              "_blank",
              "noopener,noreferrer"
            );
          }
        },
      },
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            router.push(`/companies/${record.id}`);
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
        title={record?.name ?? "Company"}
        eyebrow="Company"
        subtitle={record?.industry}
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
            <RecordWorkspaceField label="Industry" value={record?.industry} />
            <RecordWorkspaceField label="Size" value={record?.size} />
            <RecordWorkspaceField
              label="Employees"
              value={record?.employeeCount}
            />
            <RecordWorkspaceField label="Revenue" value={record?.revenue} />
            <RecordWorkspaceField label="Address" value={record?.address} />
            <RecordWorkspaceField label="City" value={record?.city} />
            <RecordWorkspaceField label="Country" value={record?.country} />
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
              label="Website"
              value={
                record?.website ? (
                  <a
                    href={
                      record.website.startsWith("http")
                        ? record.website
                        : `https://${record.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--primary)] hover:underline"
                  >
                    {record.website}
                  </a>
                ) : undefined
              }
            />
          </RecordWorkspaceGrid>
        </RecordWorkspaceSection>

        <RelatedCustomersList companyId={record?.id} />

        <RelatedContactsList companyId={record?.id} />

        <RelatedOpportunitiesList companyId={record?.id} />

        <RelatedQuotesList companyId={record?.id} />

        <RelatedInvoicesList companyId={record?.id} />

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
          <CompanyDrawer
            open={editOpen}
            onOpenChange={(openState) => {
              setEditOpen(openState);
              if (!openState) reload();
            }}
            company={record}
            onSave={(data) => void handleSave(data)}
          />
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: record.name, email: record.email }]}
            subject=""
          />
          <CompanyDeleteDialog
            open={deleteOpen}
            company={record}
            onConfirm={() => void handleDelete()}
            onCancel={() => setDeleteOpen(false)}
          />
        </>
      )}
    </>
  );
}
