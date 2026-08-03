"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Send, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { outlookService } from "@/services/outlook.service";
import { useToastContext } from "@/app/(app)/AppProviders";

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  to: { name: string; email: string }[];
  subject?: string;
  onSent?: () => void;
}

export function EmailComposer({ open, onClose, to, subject: prefillSubject, onSent }: EmailComposerProps) {
  const { success, error: showError } = useToastContext();
  const [toInput, setToInput] = useState(to.map((t) => t.email).join(", "));
  const [subject, setSubject] = useState(prefillSubject || "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const recipients = toInput.split(",").map((s) => ({
        name: s.trim(),
        email: s.trim(),
      }));
      await outlookService.send({
        to: recipients,
        subject,
        body,
      });
      success("Email sent", `Your message has been sent.`);
      onSent?.();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await outlookService.saveDraft({
        to: toInput.split(",").map((s) => ({ name: s.trim(), email: s.trim() })),
        subject,
        body,
      });
      success("Draft saved");
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save draft");
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-xl flex-col rounded-xl border bg-surface-raised shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">New Message</h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-3 p-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <input
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="recipient@example.com"
                  className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message..."
                  rows={12}
                  className="mt-1 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <Button variant="ghost" size="sm" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button onClick={handleSend} disabled={sending || !subject || !toInput}>
                  {sending ? "Sending..." : "Send"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
