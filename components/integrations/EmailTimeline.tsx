"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Mail, Reply, Forward } from "lucide-react";
import { outlookService } from "@/services/outlook.service";
import { EmailComposer } from "./EmailComposer";
import type { EmailMessage } from "@/types/common";

interface EmailTimelineProps {
  entityEmail?: string;
  entityName?: string;
}

export function EmailTimeline({ entityEmail, entityName }: EmailTimelineProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [replyTo, setReplyTo] = useState<EmailMessage | null>(null);
  const [forwardFrom, setForwardFrom] = useState<EmailMessage | null>(null);
  const [pendingConsent, setPendingConsent] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    outlookService
      .getMessages()
      .then((result) => {
        if (!cancelled) {
          setEmails(result);
          setPendingConsent(false);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load email history";
        if (message.includes("awaiting administrator approval")) {
          setPendingConsent(true);
        } else {
          setLoadError(message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entityEmails = entityEmail
    ? emails.filter((e) => e.to.some((r) => r.email === entityEmail) || e.sender.email === entityEmail)
    : [];

  return (
    <>
      {pendingConsent && (
        <div
          role="status"
          className="mb-3 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft/60 px-3 py-2.5"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warning)]" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">
            Email history is waiting for Microsoft Graph approval. CRM data keeps working normally.
          </p>
        </div>
      )}
      {loadError && (
        <div
          role="status"
          className="mb-3 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft/60 px-3 py-2.5"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--danger)]" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">{loadError}</p>
        </div>
      )}
      <div className="space-y-3">
        {entityEmails.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
            <Mail className="h-8 w-8" />
            <p>No email history with {entityName || "this contact"}</p>
          </div>
        ) : (
          entityEmails.map((email) => (
            <div key={email.id} className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {email.subject}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {email.sender.name} → {email.to.map((t) => t.name).join(", ")}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {email.bodyPreview}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setReplyTo(email)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                    title="Reply"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setForwardFrom(email)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                    title="Forward"
                  >
                    <Forward className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {replyTo && entityEmail && (
        <EmailComposer
          open={!!replyTo}
          onClose={() => setReplyTo(null)}
          to={[{ name: replyTo.sender.name, email: replyTo.sender.email }]}
          subject={`Re: ${replyTo.subject}`}
          onSent={() => { setReplyTo(null); outlookService.getMessages().then(setEmails); }}
        />
      )}

      {forwardFrom && entityEmail && (
        <EmailComposer
          open={!!forwardFrom}
          onClose={() => setForwardFrom(null)}
          to={[]}
          subject={`Fw: ${forwardFrom.subject}`}
          onSent={() => { setForwardFrom(null); outlookService.getMessages().then(setEmails); }}
        />
      )}
    </>
  );
}
