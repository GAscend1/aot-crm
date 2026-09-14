"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  Building2,
  Download,
  Loader2,
  Link2,
  Paperclip,
  PenSquare,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailComposer, type ComposerPrefill } from "@/components/integrations/EmailComposer";
import {
  outlookService,
  type EmailAssociation,
  type EmailContextMatch,
} from "@/services/outlook.service";
import { emailTextFromHtml, formatBytes } from "@/lib/email-utils";
import type { EmailMessage } from "@/types/common";

function collectAddresses(msg: EmailMessage): string[] {
  const set = new Set<string>();
  const push = (email?: string) => { if (email) set.add(email); };
  push(msg.sender.email);
  msg.to.forEach((r) => push(r.email));
  msg.cc.forEach((r) => push(r.email));
  msg.bcc.forEach((r) => push(r.email));
  return [...set];
}

const MATCH_KIND_ICON: Record<EmailContextMatch["kind"], React.ElementType> = {
  contact: User,
  customer: User,
  lead: User,
  company: Building2,
};

interface EmailDetailModalProps {
  open: boolean;
  onClose: () => void;
  message: EmailMessage | null;
  folder: string;
  onDeleted?: () => void;
}

/**
 * Email detail modal — opens centered on screen with a dark backdrop.
 * Reuses all existing API/service logic from the parent EmailView.
 */
export function EmailDetailModal({
  open,
  onClose,
  message,
  folder,
  onDeleted,
}: EmailDetailModalProps) {
  const [detail, setDetail] = useState<EmailMessage | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attachments, setAttachments] = useState<EmailMessage["attachments"]>([]);
  const [contextMatches, setContextMatches] = useState<EmailContextMatch[]>([]);
  const [associations, setAssociations] = useState<EmailAssociation[]>([]);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkFeedback, setLinkFeedback] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState<ComposerPrefill | undefined>(undefined);

  // Load full message detail when modal opens with a message
  useEffect(() => {
    if (!open || !message) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setDetail(null);
      setAttachments([]);
      setContextMatches([]);
      setAssociations([]);
      setLinkFeedback(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetail(null);
    setAttachments([]);
    setContextMatches([]);
    setAssociations([]);
    setLinkFeedback(null);

    // Mark as read if unread
    if (folder === "inbox" && !message.isRead) {
      outlookService.markAsRead(message.id).catch(() => {});
    }

    (async () => {
      try {
        const full = (await outlookService.getMessage(message.id)) ?? message;
        if (cancelled) return;
        setDetail(full);
        const [atts, matches, assocs] = await Promise.all([
          full.hasAttachments ? outlookService.getAttachments(message.id) : Promise.resolve([]),
          outlookService.getEmailContext(collectAddresses(full)),
          outlookService.getEmailAssociations(message.id),
        ]);
        if (cancelled) return;
        setAttachments(atts);
        setContextMatches(matches);
        setAssociations(assocs);
      } catch {
        if (!cancelled) setDetail(message);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, message, folder]);

  const handleDelete = async () => {
    if (!message) return;
    try {
      await outlookService.deleteMessage(message.id);
      onDeleted?.();
      onClose();
    } catch {
      // Silently fail — parent can retry
    }
  };

  const linkToRecord = async (match: EmailContextMatch) => {
    if (!detail) return;
    setLinkBusy(true);
    setLinkFeedback(null);
    try {
      await outlookService.linkEmailToRecord({
        messageId: detail.id,
        subject: detail.subject,
        description: detail.bodyPreview,
        senderEmail: detail.sender.email,
        senderName: detail.sender.name,
        receivedAt: detail.receivedAt || detail.sentAt,
        entityType: match.kind,
        entityId: match.id,
      });
      setAssociations(await outlookService.getEmailAssociations(detail.id));
      setLinkFeedback(`Linked to ${match.name}`);
    } catch (err) {
      setLinkFeedback(err instanceof Error ? err.message : "Failed to link email");
    } finally {
      setLinkBusy(false);
    }
  };

  const openCompose = (prefill?: ComposerPrefill) => {
    setComposerPrefill(prefill);
    setComposerOpen(true);
  };

  const handleComposeSent = useCallback(() => {
    onDeleted?.(); // triggers refresh in parent
    onClose();
  }, [onDeleted, onClose]);

  const display = detail ?? message;
  const bodyText = detail ? emailTextFromHtml(detail.body) : "";

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
          <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
            <div className="flex w-full max-w-[1000px] max-h-[85vh] flex-col rounded-xl border bg-surface-raised shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
                <div className="min-w-0 flex-1">
                  {detailLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading message…
                    </div>
                  ) : display ? (
                    <>
                      <h2 className="text-base font-bold text-foreground">
                        {display.subject || "(no subject)"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">From:</span>{" "}
                        {display.sender.name || display.sender.email || "Unknown"}
                        {display.sender.email && display.sender.name
                          ? ` <${display.sender.email}>`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">To:</span>{" "}
                        {display.to.map((t) => t.name || t.email).join(", ") || "—"}
                        {display.cc.length > 0 && (
                          <>
                            {" "}· <span className="font-medium text-foreground">Cc:</span>{" "}
                            {display.cc.map((t) => t.name || t.email).join(", ")}
                          </>
                        )}
                        {display.bcc.length > 0 && (
                          <>
                            {" "}· <span className="font-medium text-foreground">Bcc:</span>{" "}
                            {display.bcc.map((t) => t.name || t.email).join(", ")}
                          </>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {new Date(display.receivedAt || display.sentAt).toLocaleString()}
                        {display.isDraft ? " · Draft" : ""}
                      </p>
                    </>
                  ) : null}
                </div>
                <DialogPrimitive.Close
                  render={
                    <button
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Close"
                    />
                  }
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : display ? (
                  <div className="space-y-4">
                    {/* Email body */}
                    <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/20 p-4 text-sm text-foreground">
                      {bodyText || (
                        <span className="italic text-muted-foreground">
                          No message body.
                        </span>
                      )}
                    </div>

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Attachments
                        </h3>
                        <ul className="mt-2 space-y-1.5">
                          {attachments.map((a) => (
                            <li
                              key={a.id}
                              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs"
                            >
                              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="min-w-0 flex-1 truncate text-foreground">
                                {a.name}
                              </span>
                              <span className="shrink-0 text-muted-foreground tabular-nums">
                                {formatBytes(a.size)}
                              </span>
                              <a
                                href={outlookService.attachmentContentUrl(
                                  display.id,
                                  a.id,
                                  a.name,
                                )}
                                download={a.name}
                                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 font-medium text-[color:var(--primary)] transition-colors hover:bg-muted"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CRM context */}
                    <div className="rounded-lg border border-border bg-muted/10 p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        CRM context
                      </h3>
                      {associations.length > 0 && (
                        <ul className="mt-2 space-y-1.5">
                          {associations.map((a) => (
                            <li
                              key={a.id}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <Link2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--primary)]" />
                              <span className="font-medium text-foreground">
                                {a.entityName}
                              </span>
                              <span>
                                · linked {new Date(a.linkedAt).toLocaleDateString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {contextMatches.length === 0 && associations.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No matching CRM records in your organization for this
                          email&apos;s addresses.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {contextMatches.map((match) => {
                            const Icon = MATCH_KIND_ICON[match.kind] ?? User;
                            const alreadyLinked = associations.some(
                              (a) =>
                                a.entityType === match.kind &&
                                a.entityId === match.id,
                            );
                            return (
                              <li
                                key={`${match.kind}:${match.id}`}
                                className="flex items-center gap-2 text-xs"
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate">
                                  <span className="font-medium text-foreground">
                                    {match.name}
                                  </span>
                                  {match.company ? (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      · {match.company}
                                    </span>
                                  ) : null}
                                  <span className="text-muted-foreground">
                                    {" "}
                                    · {match.email}
                                  </span>
                                </span>
                                <a
                                  href={match.href}
                                  className="shrink-0 font-medium text-[color:var(--primary)] hover:underline"
                                >
                                  View
                                </a>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={linkBusy || alreadyLinked}
                                  onClick={() => void linkToRecord(match)}
                                  className="h-6 shrink-0 px-2 text-[11px]"
                                >
                                  {alreadyLinked ? "Linked" : "Link"}
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {linkFeedback && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {linkFeedback}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between border-t px-5 py-3">
                <div>
                  {display && !display.isDraft && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete()}
                      className="text-[color:var(--danger)]"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {display?.isDraft ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openCompose({
                          messageId: display.id,
                          to: display.to,
                          subject: display.subject,
                          body: display.body,
                        })
                      }
                    >
                      <PenSquare className="mr-1.5 h-3.5 w-3.5" />
                      Open draft
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openCompose({
                          to: display
                            ? [
                                {
                                  name: display.sender.name,
                                  email: display.sender.email,
                                },
                              ]
                            : [],
                          subject: display ? `Re: ${display.subject}` : "",
                        })
                      }
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Reply
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <EmailComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        prefill={composerPrefill}
        onSent={handleComposeSent}
      />
    </>
  );
}
