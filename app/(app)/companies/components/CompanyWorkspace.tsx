"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  DollarSign,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
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
  RelatedContactsList,
  RelatedInvoicesList,
  RelatedOpportunitiesList,
  RelatedQuotesList,
  RelatedActivitiesList,
} from "@/components/enterprise/RelatedEntityLists";
import { MetricStrip } from "@/components/common/MetricStrip";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { useToastContext } from "@/app/(app)/AppProviders";
import { companyService } from "@/services/index";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ApiRequestError } from "@/repositories/api/ApiRepository";
import { useCanUse } from "@/hooks/use-subscription";

import type { Company } from "../types";
import { CompanyForm } from "./CompanyForm";

interface CompanyWorkspaceProps {
  onChanged?: () => void;
}

interface CompanyMetrics {
  peopleCount: number;
  openOpportunities: number;
  pipelineValue: number;
  wonRevenue: number;
  openTickets: number;
}

async function fetchCompanyMetrics(companyId: string): Promise<CompanyMetrics> {
  try {
    const [contactsRes, oppsRes, ticketsRes] = await Promise.all([
      fetch(`/api/contacts?filters=${encodeURIComponent(JSON.stringify({ companyId }))}&pageSize=1`, { cache: "no-store" }),
      fetch(`/api/opportunities?filters=${encodeURIComponent(JSON.stringify({ companyId }))}&pageSize=50`, { cache: "no-store" }),
      fetch(`/api/tickets?filters=${encodeURIComponent(JSON.stringify({ companyId }))}&pageSize=50`, { cache: "no-store" }),
    ]);

    const contacts = await contactsRes.json().catch(() => ({ total: 0, data: [] }));
    const opps = await oppsRes.json().catch(() => ({ total: 0, data: [] }));
    const tickets = await ticketsRes.json().catch(() => ({ total: 0, data: [] }));

    const opportunities = (opps.data ?? []) as Array<{ status?: string; value?: number; stage?: string }>;
    const openOpps = opportunities.filter((o) => o.status !== "Closed" && o.status !== "Won" && o.status !== "Lost");
    const wonOpps = opportunities.filter((o) => o.status === "Won" || o.stage === "Closed Won");

    return {
      peopleCount: contacts.total ?? (contacts.data ?? []).length,
      openOpportunities: openOpps.length,
      pipelineValue: openOpps.reduce((sum, o) => sum + (o.value ?? 0), 0),
      wonRevenue: wonOpps.reduce((sum, o) => sum + (o.value ?? 0), 0),
      openTickets: tickets.total ?? (tickets.data ?? []).length,
    };
  } catch {
    return { peopleCount: 0, openOpportunities: 0, pipelineValue: 0, wonRevenue: 0, openTickets: 0 };
  }
}

export function CompanyWorkspace({ onChanged }: CompanyWorkspaceProps) {
  const { success, error: showError } = useToastContext();
  const { record, loading, recordId, close, reload } =
    useRecordWorkspace(companyService);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [metrics, setMetrics] = useState<CompanyMetrics>({ peopleCount: 0, openOpportunities: 0, pipelineValue: 0, wonRevenue: 0, openTickets: 0 });

  // Plan-gated sections: quotes/invoices require Professional+ (server enforces too).
  const canQuote = useCanUse("quotes");
  const canInvoice = useCanUse("invoices");
  const canEmail = useCanUse("outlook_email");

  useEffect(() => {
    if (record?.id) {
      fetchCompanyMetrics(record.id).then(setMetrics);
    }
  }, [record?.id]);

  const handleSave = useCallback(
    async (data: Company) => {
      if (!record) return;
      try {
        const updated = await companyService.update(record.id, data as Partial<Company>);
        success("Company updated", `${updated.name} has been updated.`);
        setEditing(false);
        onChanged?.();
        reload();
      } catch (err) {
        if (err instanceof ApiRequestError) throw err;
        showError("Error", "Failed to save company.");
        throw new ApiRequestError(500, "Failed to save company.");
      }
    },
    [record, success, showError, onChanged, reload]
  );

  const handleDelete = useCallback(async () => {
    if (!record) return;
    setDeleting(true);
    try {
      await companyService.delete(record.id);
      success("Company archived", `${record.name} has been archived.`);
      setDeleteOpen(false);
      onChanged?.();
      close();
    } catch {
      showError("Error", "Failed to archive company.");
    } finally {
      setDeleting(false);
    }
  }, [record, success, showError, onChanged, close]);

  const handleCreatePerson = useCallback(() => {
    if (!record) return;
    close();
    window.location.href = `/contacts?companyId=${encodeURIComponent(record.id)}`;
  }, [record, close]);

  const handleCreateOpportunity = useCallback(() => {
    if (!record) return;
    close();
    window.location.href = `/opportunities?companyId=${encodeURIComponent(record.id)}`;
  }, [record, close]);

  const actionBar = useMemo(
    () => [
      {
        label: "Add Person",
        icon: UserPlus,
        onClick: handleCreatePerson,
      },
      {
        label: "Create Opportunity",
        icon: Plus,
        tone: "--success",
        onClick: handleCreateOpportunity,
      },
      ...(canEmail
        ? [
            {
              label: "Email",
              icon: Mail,
              tone: "--info" as const,
              disabled: !record?.email,
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
    ],
    [record, handleCreatePerson, handleCreateOpportunity, canEmail]
  );

  const moreActions = useMemo(
    () => [
      {
        label: "Open Full Page",
        icon: ExternalLink,
        onClick: () => {
          if (record) {
            close();
            window.location.href = `/companies/${record.id}`;
          }
        },
      },
      {
        label: "Archive Company",
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteOpen(true),
      },
    ],
    [record, close]
  );

  const moneyFmt = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  const metricItems = useMemo(
    () => [
      { label: "People", value: metrics.peopleCount, icon: Users },
      { label: "Open Opps", value: metrics.openOpportunities, icon: Briefcase },
      { label: "Pipeline", value: moneyFmt(metrics.pipelineValue), icon: DollarSign, tone: "--chart-1" },
      { label: "Won Revenue", value: moneyFmt(metrics.wonRevenue), icon: TrendingUp, tone: "--success" },
    ],
    [metrics]
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
        editing={editing}
        keepHeaderWhileEditing
        editor={
          record ? (
            <CompanyForm
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
            <RecordMoreMenu actions={moreActions} />
          </>
        }
        layout="split"
        sidebar={
          <div className="flex h-full flex-col gap-4 p-4 lg:w-72 lg:p-5">
            <RecordWorkspaceSection title="Inspector">
              <div className="space-y-3">
                <RecordWorkspaceField label="Industry" value={record?.industry} />
                <RecordWorkspaceField label="Size" value={record?.size} />
                <RecordWorkspaceField label="Status" value={record?.status} />
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
            <MetricStrip items={metricItems} />

            <RecordWorkspaceSection title="Company Details">
              <RecordWorkspaceGrid>
                <RecordWorkspaceField label="Employees" value={record?.employeeCount} />
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

            {/* People (Contacts) — the account's people. Customers are lifecycle-filtered
                People/Companies; showing both lists would duplicate the same records. */}
            <RelatedContactsList companyId={record?.id} limit={3} />

            <RelatedOpportunitiesList companyId={record?.id} limit={3} />

            {canQuote && <RelatedQuotesList companyId={record?.id} limit={3} />}

            {canInvoice && <RelatedInvoicesList companyId={record?.id} limit={3} />}

            <RelatedActivitiesList companyId={record?.id} limit={3} />
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
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Archive Company"
            message={
              <>
                Archive <strong>{record.name}</strong>? This will remove the
                company from active lists while keeping linked records intact.
              </>
            }
            confirmLabel="Archive Company"
            variant="danger"
            loading={deleting}
            onConfirm={() => void handleDelete()}
          />
        </>
      )}
    </>
  );
}
