"use client";

import { use, useCallback, useState } from "react";
import { Mail, Phone, Calendar, Video } from "lucide-react";
import { RecordDetail } from "@/components/enterprise/RecordDetail";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { EmailTimeline } from "@/components/integrations/EmailTimeline";
import { EventModal } from "@/components/integrations/EventModal";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";
import { contactService } from "@/services/index";
import type { Contact } from "@/services/contact.service";
import { useToastContext } from "@/app/(app)/AppProviders";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { success } = useToastContext();
  const [emailOpen, setEmailOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [contactRecord, setContactRecord] = useState<Contact | null>(null);

  const handleTagsChange = useCallback(
    async (record: Contact, tags: string[]) => {
      await contactService.update(record.id, { tags } as unknown as Partial<Contact>);
      setContactRecord(record);
      success("Tags updated");
    },
    [success]
  );

  return (
    <>
      <RecordDetail<Contact>
        id={id}
        service={contactService}
        backHref="/contacts"
        title="Contact"
        getTitle={(c) => `${c.firstName} ${c.lastName}`}
        getDescription={(c) => c.position}
        onLoaded={(c) => setContactRecord(c)}
        renderFields={(c) => [
          { label: "Email", value: <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline">{c.email}</a> },
          { label: "Phone", value: c.phone || "-" },
          { label: "Company", value: c.company || "-" },
          { label: "Position", value: c.position || "-" },
          { label: "City", value: c.city || "-" },
          { label: "Country", value: c.country || "-" },
        ]}
        renderStatus={(c) => ({
          label: "Status",
          value: (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
              {c.status}
            </span>
          ),
        })}
        renderTags={(c) => c.tags}
        onTagsChange={handleTagsChange}
        extraSections={(c) => (
          <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Email History</h2>
            <EmailTimeline entityEmail={c.email} entityName={`${c.firstName} ${c.lastName}`} />
          </div>
        )}
        quickActions={(c) => [
          { label: "Send Email", icon: Mail, onClick: () => setEmailOpen(true) },
          { label: "Teams Meeting", icon: Video, onClick: () => setTeamsOpen(true) },
          { label: "Zoom Meeting", icon: Video, onClick: () => setZoomOpen(true) },
          { label: "Schedule Meeting", icon: Calendar, onClick: () => setEventOpen(true) },
        ]}
      />

      {contactRecord && (
        <>
          <EmailComposer
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            to={[{ name: `${contactRecord.firstName} ${contactRecord.lastName}`, email: contactRecord.email }]}
            subject=""
          />
          <EventModal
            open={eventOpen}
            onClose={() => setEventOpen(false)}
            entityType="contact"
            entityId={contactRecord.id}
          />
          <TeamsMeetingDialog
            open={teamsOpen}
            onClose={() => setTeamsOpen(false)}
            entityName={`${contactRecord.firstName} ${contactRecord.lastName}`}
          />
          <ZoomMeetingDialog
            open={zoomOpen}
            onClose={() => setZoomOpen(false)}
            entityName={`${contactRecord.firstName} ${contactRecord.lastName}`}
          />
        </>
      )}
    </>
  );
}
