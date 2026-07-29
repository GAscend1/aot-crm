"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Calendar, Video } from "lucide-react";

import {
  DetailView,
  DetailSection,
  DetailField,
  DetailGrid,
} from "@/components/enterprise/DetailView";
import { SectionCard } from "@/components/common/SectionCard";
import { TagInput } from "@/components/enterprise/TagInput";
import { Timeline, type TimelineEntry } from "@/components/enterprise/Timeline";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EmailTimeline } from "@/components/integrations/EmailTimeline";
import { EventModal } from "@/components/integrations/EventModal";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";

import { useToastContext } from "@/app/(app)/AppProviders";
import { customerService } from "@/services/index";
import type { Customer } from "@/services/customer.service";
import { CustomerDrawer } from "../components/CustomerDrawer";
import { CustomerDeleteDialog } from "../components/CustomerDeleteDialog";

interface CustomerDetailClientProps {
  id: string;
}

export function CustomerDetailClient({ id }: CustomerDetailClientProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [auditLog, setAuditLog] = useState<TimelineEntry[]>([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    customerService.findById(id).then((result) => {
      if (!result) {
        router.replace("/customers");
        return;
      }
      setCustomer(result);
      setLoading(false);
    });
  }, [id, router]);

  const handleSave = useCallback(
    async (data: Partial<Customer>) => {
      if (!customer) return;
      try {
        const updated = await customerService.update(customer.id, data);
        setCustomer(updated);
        setAuditLog((prev) => [
          {
            id: Date.now().toString(),
            action: "updated",
            field: Object.keys(data).join(", "),
            userName: "You",
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
        success("Customer updated");
        setDrawerOpen(false);
      } catch {
        showError("Error", "Failed to update customer.");
      }
    },
    [customer, success, showError]
  );

  const handleDelete = useCallback(async () => {
    if (!customer) return;
    try {
      await customerService.delete(customer.id);
      success("Customer deleted", `${customer.name} has been removed.`);
      router.replace("/customers");
    } catch {
      showError("Error", "Failed to delete customer.");
    }
  }, [customer, success, showError, router]);

  const handleTagsChange = useCallback(
    async (tags: string[]) => {
      if (!customer) return;
      const updated = await customerService.update(customer.id, { tags } as unknown as Partial<Customer>);
      setCustomer(updated);
    },
    [customer]
  );

  if (loading || !customer) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <>
      <DetailView
        title={customer.name}
        description={customer.position}
        backHref="/customers"
        onEdit={() => setDrawerOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DetailSection title="Contact Information">
              <DetailGrid>
                <DetailField
                  label="Email"
                  value={
                    <a
                      href={`mailto:${customer.email}`}
                      className="flex items-center gap-1.5 text-blue-600 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {customer.email}
                    </a>
                  }
                />
                <DetailField
                  label="Phone"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {customer.phone}
                    </span>
                  }
                />
                <DetailField label="Position" value={customer.position} />
                <DetailField label="Company" value={customer.company} />
              </DetailGrid>
            </DetailSection>

            <DetailSection title="Location">
              <DetailGrid>
                <DetailField label="City" value={customer.city} />
                <DetailField label="Country" value={customer.country} />
              </DetailGrid>
            </DetailSection>

            <DetailSection title="Tags">
              <TagInput
                tags={customer.tags}
                onChange={handleTagsChange}
                suggestions={["enterprise", "tech", "saas", "ecommerce", "startup"]}
              />
            </DetailSection>

            {customer.notes && (
              <DetailSection title="Notes">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {customer.notes}
                </p>
              </DetailSection>
            )}

            <DetailSection title="Email History">
              <EmailTimeline entityEmail={customer.email} entityName={customer.name} />
            </DetailSection>

            <DetailSection title="Activity Timeline">
              <Timeline
                entries={
                  auditLog.length > 0
                    ? auditLog
                    : [
                        {
                          id: "1",
                          action: "created",
                          userName: "System",
                          timestamp: customer.createdAt,
                        },
                      ]
                }
              />
            </DetailSection>
          </div>

          <div className="space-y-6">
            <DetailSection title="Details">
              <div className="space-y-4">
                <DetailField
                  label="Status"
                  value={
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        customer.status === "Active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : customer.status === "Prospect"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : customer.status === "Inactive"
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {customer.status}
                    </span>
                  }
                />
                <DetailField label="Created" value={customer.createdAt} />
                <DetailField label="Updated" value={customer.updatedAt} />
              </div>
            </DetailSection>

            <SectionCard title="Quick Actions">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setEmailOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
                <button
                  onClick={() => setTeamsOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Video className="h-4 w-4 text-purple-500" />
                  Teams Meeting
                </button>
                <button
                  onClick={() => setZoomOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Video className="h-4 w-4 text-blue-500" />
                  Zoom Meeting
                </button>
                <button
                  onClick={() => setEventOpen(true)}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:border-slate-700"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Meeting
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </DetailView>

      <CustomerDrawer
        open={drawerOpen}
        onOpenChange={(open) => setDrawerOpen(open)}
        customer={customer}
        onSave={handleSave}
      />

      <CustomerDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => setDeleteDialogOpen(open)}
        customer={customer}
        onConfirm={handleDelete}
      />

      <EmailComposer
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        to={[{ name: customer.name, email: customer.email }]}
        subject=""
      />

      <EventModal
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        entityType="customer"
        entityId={customer.id}
      />

      <TeamsMeetingDialog
        open={teamsOpen}
        onClose={() => setTeamsOpen(false)}
        entityName={customer.name}
      />

      <ZoomMeetingDialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        entityName={customer.name}
      />
    </>
  );
}
