"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  PenSquare,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IntegrationWarning } from "@/components/common/IntegrationWarning";
import { IntegrationStateBanner } from "@/components/common/IntegrationStateBanner";
import { EmailComposer } from "@/components/integrations/EmailComposer";
import { outlookService } from "@/services/outlook.service";
import { classifyGraphError, type IntegrationStatus } from "@/services/integration-gate";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { cn } from "@/lib/utils";
import type { EmailMessage } from "@/types/common";

type Folder = "inbox" | "sent" | "drafts";

const FOLDER_META: { id: Folder; label: string; icon: React.ElementType }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: PenSquare },
];

/**
 * Email view of the Activities module (merged from the old /activities/email
 * page). Emails are communication records in the same work engine as activities.
 */
export function EmailView() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrationIssue, setIntegrationIssue] = useState<IntegrationStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadMessages = useCallback(() => {
    outlookService
      .getMessages(folder)
      .then((result) => {
        setMessages(result);
        setIntegrationIssue(null);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setMessages([]);
        const status = classifyGraphError(err);
        if (status.state === "GRAPH_UNAVAILABLE" && !status.detail?.includes("graph_not_enabled")) {
          setIntegrationIssue(null);
          setLoadError(status.detail || "Failed to load messages");
        } else {
          setIntegrationIssue(status);
          setLoadError(null);
        }
      })
      .finally(() => setLoading(false));
  }, [folder]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleFolderChange = (next: Folder) => {
    setFolder(next);
    setSelectedId(null);
    setLoading(true);
  };

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await outlookService.deleteMessage(selected.id);
      setSelectedId(null);
      loadMessages();
    } catch {
      setLoadError("Failed to delete message");
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <FeatureGate feature="outlook_email" featureLabel="Outlook Email" mode="replace">
    <div className="space-y-4">
      {integrationIssue && (
        <IntegrationStateBanner
          status={integrationIssue}
          onRetry={loadMessages}
          onDismiss={() => setIntegrationIssue(null)}
        />
      )}

      {loadError && (
        <IntegrationWarning
          title="Could not load messages"
          message={loadError}
          onDismiss={() => setLoadError(null)}
        />
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setComposerOpen(true)}>
          <PenSquare className="mr-1.5 h-4 w-4" />
          Compose
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* Folder list */}
        <nav className="space-y-1" aria-label="Mail folders">
          {FOLDER_META.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleFolderChange(id)}
              aria-current={folder === id ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                folder === id
                  ? "bg-primary-soft text-[color:var(--primary)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {id === "inbox" && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--primary)] tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Message list + detail */}
        <div className="rounded-xl border bg-surface-raised">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
              <MailOpen className="h-8 w-8" />
              <p>No messages in {folder}</p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedId(message.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !message.isRead && "bg-primary-soft/30"
                  )}
                >
                  {message.isRead ? (
                    <MailOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                  ) : (
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--primary)]" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn("truncate text-sm", message.isRead ? "text-foreground" : "font-semibold text-foreground")}>
                        {folder === "sent" ? `To: ${message.to.map((t) => t.name || t.email).join(", ")}` : message.sender.name || message.sender.email || "Unknown"}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                        {new Date(message.receivedAt || message.sentAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-foreground/90">{message.subject}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{message.bodyPreview}</span>
                  </span>
                  {message.hasAttachments && <Paperclip className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 rounded-xl border bg-surface-raised p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">{selected.subject}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                From: {selected.sender.name || selected.sender.email || "Unknown"}
                {selected.sender.email && selected.sender.name ? ` <${selected.sender.email}>` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                To: {selected.to.map((t) => t.name || t.email).join(", ") || "—"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setComposerOpen(true)}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Reply
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => void handleDelete()} aria-label="Delete message">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 text-sm whitespace-pre-wrap text-foreground">
            {selected.body || <span className="text-muted-foreground italic">No message body.</span>}
          </div>
        </div>
      )}

      <EmailComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        to={selected?.sender?.email ? [{ name: selected.sender.name, email: selected.sender.email }] : []}
        subject={selected ? `Re: ${selected.subject}` : ""}
        onSent={() => loadMessages()}
      />
    </div>
    </FeatureGate>
  );
}
