"use client";

import { use, useState } from "react";
import { Mail, Calendar, Video } from "lucide-react";
import { RecordDetail } from "@/components/enterprise/RecordDetail";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EventModal } from "@/components/integrations/EventModal";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";
import { companyService } from "@/services/index";
import type { Company } from "@/services/company.service";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [companyRecord, setCompanyRecord] = useState<Company | null>(null);

  return (
    <>
      <RecordDetail<Company>
        id={id}
        service={companyService}
        backHref="/companies"
        title="Company"
        getTitle={(c) => c.name}
        getDescription={(c) => `${c.industry} · ${c.size} employees`}
        onLoaded={(c) => setCompanyRecord(c)}
        renderFields={(c) => [
          { label: "Email", value: <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a> },
          { label: "Phone", value: c.phone || "-" },
          { label: "Website", value: c.website ? <a href={c.website} target="_blank" className="text-blue-600 hover:underline">{c.website}</a> : "-" },
          { label: "Industry", value: c.industry },
          { label: "Size", value: c.size },
          { label: "Employees", value: c.employeeCount.toLocaleString() },
          { label: "Revenue", value: c.revenue || "-" },
          { label: "Address", value: c.address || "-" },
          { label: "City", value: c.city },
          { label: "Country", value: c.country },
        ]}
        renderStatus={(c) => ({
          label: "Status",
          value: (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
              {c.status}
            </span>
          ),
        })}
        quickActions={(c) => [
          { label: "Send Email", icon: Mail, onClick: () => setEmailOpen(true) },
          { label: "Teams Meeting", icon: Video, onClick: () => setTeamsOpen(true) },
          { label: "Zoom Meeting", icon: Video, onClick: () => setZoomOpen(true) },
          { label: "Schedule Meeting", icon: Calendar, onClick: () => setEventOpen(true) },
        ]}
      />

      {companyRecord && (
        <>
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: companyRecord.name, email: companyRecord.email }]}
            subject=""
          />
          <EventModal
            open={eventOpen}
            onClose={() => setEventOpen(false)}
            entityType="company"
            entityId={companyRecord.id}
          />
          <TeamsMeetingDialog
            open={teamsOpen}
            onClose={() => setTeamsOpen(false)}
            entityName={companyRecord.name}
          />
          <ZoomMeetingDialog
            open={zoomOpen}
            onClose={() => setZoomOpen(false)}
            entityName={companyRecord.name}
          />
        </>
      )}
    </>
  );
}
