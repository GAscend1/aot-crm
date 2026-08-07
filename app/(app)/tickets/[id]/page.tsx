"use client";

import { use, useState } from "react";
import { Mail, Calendar, Video } from "lucide-react";
import { RecordDetail } from "@/components/enterprise/RecordDetail";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EventModal } from "@/components/integrations/EventModal";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";
import { ticketService } from "@/services/index";
import { useCanUse } from "@/hooks/use-subscription";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import type { Ticket } from "@/services/ticket.service";

const statusColors: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Resolved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  High: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Plan-gated actions (server enforces too): Email requires Professional+,
  // Teams/Zoom require Enterprise. Locked plans get no dead buttons.
  const canEmail = useCanUse("outlook_email");
  const canTeams = useCanUse("teams");
  const canZoom = useCanUse("zoom");
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [ticketRecord, setTicketRecord] = useState<Ticket | null>(null);

  return (
    <FeatureGate feature="tickets" featureLabel="Tickets" mode="replace">
      <RecordDetail<Ticket>
        id={id}
        service={ticketService}
        backHref="/tickets"
        title="Ticket"
        getTitle={(t) => t.subject}
        getDescription={(t) => `${t.requester} · ${t.department}`}
        onLoaded={(t) => setTicketRecord(t)}
        renderFields={(t) => [
          { label: "Requester", value: t.requester },
          { label: "Assignee", value: t.assignee },
          { label: "Department", value: t.department },
          { label: "SLA", value: t.sla },
          { label: "Comments", value: t.comments },
          { label: "Attachments", value: t.attachments },
          { label: "Description", value: t.description },
        ]}
        renderStatus={(t) => ({
          label: "Status",
          value: (
            <div className="space-y-3">
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[t.status] || ""}`}>
                  {t.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Priority</p>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[t.priority] || ""}`}>
                  {t.priority}
                </span>
              </div>
            </div>
          ),
        })}
        quickActions={() => [
          ...(canEmail ? [{ label: "Send Email", icon: Mail, onClick: () => setEmailOpen(true) }] : []),
          ...(canTeams ? [{ label: "Teams Meeting", icon: Video, onClick: () => setTeamsOpen(true) }] : []),
          ...(canZoom ? [{ label: "Zoom Meeting", icon: Video, onClick: () => setZoomOpen(true) }] : []),
          { label: "Schedule Meeting", icon: Calendar, onClick: () => setEventOpen(true) },
        ]}
      />

      {ticketRecord && (
        <>
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: ticketRecord.requester, email: `${ticketRecord.requester.toLowerCase().replace(/\s+/g, ".")}@email.com` }]}
            subject={`Re: ${ticketRecord.subject}`}
          />
          <EventModal
            open={eventOpen}
            onClose={() => setEventOpen(false)}
            entityType="ticket"
            entityId={ticketRecord.id}
          />
          <TeamsMeetingDialog
            open={teamsOpen}
            onClose={() => setTeamsOpen(false)}
            entityName={ticketRecord.subject}
          />
          <ZoomMeetingDialog
            open={zoomOpen}
            onClose={() => setZoomOpen(false)}
            entityName={ticketRecord.subject}
          />
        </>
      )}
    </FeatureGate>
  );
}
