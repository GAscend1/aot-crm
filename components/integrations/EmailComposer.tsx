"use client";

import { useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Send, X, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { outlookService } from "@/services/outlook.service";
import { useToastContext } from "@/app/(app)/AppProviders";
import { formatBytes } from "@/lib/email-utils";
import type { EmailAttachment } from "@/types/common";

const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // Graph limit for base64 file attachments

export interface ComposerPrefill {
  /** Editing an existing draft: messageId is set; Save updates it, Send sends it. */
  messageId?: string;
  to?: { name: string; email: string }[];
  cc?: { name: string; email: string }[];
  bcc?: { name: string; email: string }[];
  subject?: string;
  body?: string;
}

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  to?: { name: string; email: string }[];
  subject?: string;
  prefill?: ComposerPrefill;
  onSent?: () => void;
}

function parseRecipients(input: string): { name: string; email: string }[] {
  return input
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((email) => ({ name: email, email }));
}

function fileToAttachment(file: File): Promise<EmailAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
      resolve({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        contentBytes: base64,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compose / reply / forward / draft-edit dialog. Sending goes through
 * Microsoft Graph as the authenticated user — success is only reported after
 * Graph confirms it (never faked). Drafts: "Save Draft" creates (or updates,
 * in edit mode) a real Graph draft; "Send" sends an existing draft when
 * editing.
 */
export function EmailComposer({ open, onClose, to, subject: prefillSubject, prefill, onSent }: EmailComposerProps) {
  const { success, error: showError } = useToastContext();
  const [toInput, setToInput] = useState((prefill?.to ?? to ?? []).map((t) => t.email).join(", "));
  const [ccInput, setCcInput] = useState((prefill?.cc ?? []).map((t) => t.email).join(", "));
  const [bccInput, setBccInput] = useState((prefill?.bcc ?? []).map((t) => t.email).join(", "));
  const [subject, setSubject] = useState(prefill?.subject ?? prefillSubject ?? "");
  const [body, setBody] = useState(prefill?.body ?? "");
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDraftEdit = Boolean(prefill?.messageId);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const existing = attachments.length;
    const pending: EmailAttachment[] = [];
    for (const file of Array.from(files)) {
      if (existing + pending.length >= MAX_ATTACHMENTS) {
        showError(`At most ${MAX_ATTACHMENTS} attachments per message.`);
        break;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        showError(`"${file.name}" exceeds the 4 MB attachment limit.`);
        continue;
      }
      try {
        pending.push(await fileToAttachment(file));
      } catch {
        // skip unreadable file
      }
    }
    if (pending.length) setAttachments((prev) => [...prev, ...pending]);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      if (isDraftEdit) {
        await outlookService.updateDraft(prefill!.messageId!, {
          to: parseRecipients(toInput),
          subject,
          body,
        });
        await outlookService.sendDraft(prefill!.messageId!);
        success("Draft sent", "Your message has been sent through Microsoft 365.");
      } else {
        await outlookService.send({
          to: parseRecipients(toInput),
          cc: parseRecipients(ccInput),
          bcc: parseRecipients(bccInput),
          subject,
          body,
          attachments,
        });
        success("Email sent", "Your message has been sent through Microsoft 365.");
      }
      onSent?.();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      if (isDraftEdit) {
        await outlookService.updateDraft(prefill!.messageId!, {
          to: parseRecipients(toInput),
          subject,
          body,
        });
        success("Draft updated", "Your changes were saved to Microsoft 365.");
      } else {
        await outlookService.saveDraft({
          to: parseRecipients(toInput),
          subject,
          body,
        });
        success("Draft saved", "Your draft was saved to Microsoft 365.");
      }
      onSent?.();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const canSend = toInput.trim().length > 0 && subject.trim().length > 0 && !sending;

  const fieldClass =
    "mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-xl border bg-surface-raised shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                {isDraftEdit ? "Edit Draft" : "New Message"}
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-3 overflow-y-auto p-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <input value={toInput} onChange={(e) => setToInput(e.target.value)} placeholder="recipient@example.com" className={fieldClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cc</label>
                <input value={ccInput} onChange={(e) => setCcInput(e.target.value)} placeholder="cc@example.com" className={fieldClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Bcc</label>
                <input value={bccInput} onChange={(e) => setBccInput(e.target.value)} placeholder="bcc@example.com" className={fieldClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter subject..." className={fieldClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message..."
                  rows={10}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {attachments.length > 0 && (
                <ul className="space-y-1.5">
                  {attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-foreground">{a.name}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">{formatBytes(a.size)}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                        aria-label={`Remove ${a.name}`}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSaveDraft} disabled={saving || sending}>
                  {isDraftEdit ? "Save Changes" : "Save Draft"}
                </Button>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
                <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                  <Paperclip className="mr-1.5 h-4 w-4" />
                  Attach
                </Button>
              </div>
              <Button onClick={handleSend} disabled={!canSend}>
                {sending ? "Sending..." : "Send"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
