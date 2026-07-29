"use client";

import { use, useState } from "react";
import { Mail, Phone, TrendingUp, Calendar, Video } from "lucide-react";
import { RecordDetail } from "@/components/enterprise/RecordDetail";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EventModal } from "@/components/integrations/EventModal";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";
import { leadService } from "@/services/index";
import type { Lead } from "@/services/lead.service";

const statusColors: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Contacted: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Qualified: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Proposal: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  Negotiation: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "Closed Won": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "Closed Lost": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [leadRecord, setLeadRecord] = useState<Lead | null>(null);

  return (
    <>
      <RecordDetail<Lead>
        id={id}
        service={leadService}
        backHref="/leads"
        title="Lead"
        getTitle={(l) => l.title}
        getDescription={(l) => l.company}
        onLoaded={(l) => setLeadRecord(l)}
        renderFields={(l) => [
          { label: "Contact", value: l.contactName },
          { label: "Email", value: <a href={`mailto:${l.email}`} className="text-blue-600 hover:underline">{l.email}</a> },
          { label: "Phone", value: l.phone || "-" },
          { label: "Source", value: l.source },
          { label: "Owner", value: l.owner },
          { label: "Score", value: l.score },
          { label: "Probability", value: `${l.probability}%` },
          { label: "Expected Revenue", value: `$${l.expectedRevenue.toLocaleString()}` },
        ]}
        renderStatus={(l) => ({
          label: "Status",
          value: (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[l.status] || ""}`}>
              {l.status}
            </span>
          ),
        })}
        quickActions={(l) => [
          { label: "Send Email", icon: Mail, onClick: () => setEmailOpen(true) },
          { label: "Teams Meeting", icon: Video, onClick: () => setTeamsOpen(true) },
          { label: "Zoom Meeting", icon: Video, onClick: () => setZoomOpen(true) },
          { label: "Schedule Meeting", icon: Calendar, onClick: () => setEventOpen(true) },
        ]}
      />

      {leadRecord && (
        <>
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: leadRecord.contactName, email: leadRecord.email }]}
            subject=""
          />
          <EventModal
            open={eventOpen}
            onClose={() => setEventOpen(false)}
            entityType="lead"
            entityId={leadRecord.id}
          />
          <TeamsMeetingDialog
            open={teamsOpen}
            onClose={() => setTeamsOpen(false)}
            entityName={leadRecord.title}
          />
          <ZoomMeetingDialog
            open={zoomOpen}
            onClose={() => setZoomOpen(false)}
            entityName={leadRecord.title}
          />
        </>
      )}
    </>
  );
}
