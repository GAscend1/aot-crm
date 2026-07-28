"use client";

import { use, useCallback } from "react";
import { Mail, Phone } from "lucide-react";
import { RecordDetail } from "@/components/enterprise/RecordDetail";
import { contactService } from "@/services/index";
import type { Contact } from "@/services/contact.service";
import { useToastContext } from "@/app/(app)/AppProviders";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { success } = useToastContext();

  const handleTagsChange = useCallback(
    async (record: Contact, tags: string[]) => {
      await contactService.update(record.id, { tags } as unknown as Partial<Contact>);
      success("Tags updated");
    },
    [success]
  );

  return (
    <RecordDetail<Contact>
      id={id}
      service={contactService}
      backHref="/contacts"
      title="Contact"
      getTitle={(c) => `${c.firstName} ${c.lastName}`}
      getDescription={(c) => c.position}
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
      quickActions={() => [
        { label: "Send Email", icon: Mail, onClick: () => {} },
        { label: "Log Call", icon: Phone, onClick: () => {} },
      ]}
    />
  );
}
