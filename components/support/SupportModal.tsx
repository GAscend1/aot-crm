"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LifeBuoy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastContext } from "@/app/(app)/AppProviders";

export const SUPPORT_CATEGORIES = [
  "General Question",
  "Technical Issue",
  "Billing / Subscription",
  "Microsoft 365 Integration",
  "Feature Request",
  "Other",
] as const;

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Help & Support — a real support form that persists a request through the
 * existing Tickets module (POST /api/support → same Ticket model, dedicated
 * route so blocked/expired-trial workspaces can still reach support). Tenant
 * isolation is enforced server-side: the organizationId is always derived
 * from the authenticated session, never sent by the client. No email is sent
 * — the request lands in the workspace's Tickets list and the AOT team
 * reviews it there.
 */
export function SupportModal({ open, onClose }: SupportModalProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { success, error: showError } = useToastContext();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(SUPPORT_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";

  const reset = () => {
    setSubject("");
    setCategory(SUPPORT_CATEGORIES[0]);
    setMessage("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      showError("Missing details", "Add a subject and a message before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `[Support] ${subject.trim()}`,
          description:
            message.trim() +
            (pathname ? `\n\n[Reported from page: ${pathname}]` : ""),
          // Reuses the Ticket.department column for the category — no schema change.
          department: category,
          requester: userName || userEmail ? `${userName} <${userEmail}>`.trim() : undefined,
          priority: "Medium",
          status: "Open",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Could not submit support request");
      success("Your support request has been submitted.");
      handleClose();
    } catch (err) {
      showError("Could not submit", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-[color:var(--info)]" aria-hidden />
            Help & Support
          </DialogTitle>
          <DialogDescription>
            Submit a support request — it is saved to this workspace&apos;s
            Tickets and the AOT team will follow up there.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="support-subject" className="text-xs font-medium text-muted-foreground">
              Subject
            </label>
            <Input
              id="support-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your request"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="support-category" className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="support-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="support-message" className="text-xs font-medium text-muted-foreground">
              Message
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe the issue or question in detail..."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <p>
              Submitting as <span className="font-medium text-foreground">{userName || "User"}</span>
              {userEmail ? ` (${userEmail})` : ""} — attached to your workspace
              server-side.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null}
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
