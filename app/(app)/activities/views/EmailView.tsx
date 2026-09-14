"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  PenSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IntegrationWarning } from "@/components/common/IntegrationWarning";
import { IntegrationStateBanner } from "@/components/common/IntegrationStateBanner";
import { EmailComposer, type ComposerPrefill } from "@/components/integrations/EmailComposer";
import {
  outlookService,
} from "@/services/outlook.service";
import { classifyGraphError, type IntegrationStatus } from "@/services/integration-gate";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { cn } from "@/lib/utils";
import type { EmailMessage } from "@/types/common";
import { EmailDetailModal } from "./EmailDetailModal";

type Folder = "inbox" | "sent" | "drafts";

const FOLDER_META: { id: Folder; label: string; icon: React.ElementType }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: PenSquare },
];



/**
 * Email view of the Activities module — a CRM-oriented mailbox backed by the
 * authenticated user's real Microsoft 365 data.
 *
 * State separation: the Graph connection state and the mailbox request state
 * are independent. A single folder request failing (e.g. Drafts) shows a
 * mailbox-specific error and NEVER reports "Microsoft 365 unavailable" — only
 * genuine auth/session failures render the global connection banner.
 */
export function EmailView() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [integrationIssue, setIntegrationIssue] = useState<IntegrationStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState<ComposerPrefill | undefined>(undefined);

  const folderSeq = useRef(0);

  const loadPage = useCallback((target: Folder, skip: number) => {
    const seq = ++folderSeq.current;
    // Loading state is set by the user action (folder change / "Load more"
    // click) — never synchronously inside the mount effect. All setState calls
    // live in promise callbacks so the effect body stays side-effect free.
    const finish = () => {
      if (seq === folderSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    outlookService
      .getMessages(target, skip)
      .then((result) => {
        if (seq !== folderSeq.current) return; // a newer folder switch superseded this
        setMessages((prev) => (skip === 0 ? result.messages : [...prev, ...result.messages]));
        setHasMore(result.hasMore);
        setIntegrationIssue(null);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (seq !== folderSeq.current) return;
        // Graph connection problems → global banner; everything else is a
        // mailbox request error scoped to this folder.
        const status = classifyGraphError(err);
        if (
          status.state === "SIGN_IN_REQUIRED" ||
          status.state === "TOKEN_EXPIRED" ||
          status.state === "RECONSENT_REQUIRED"
        ) {
          setIntegrationIssue(status);
          setLoadError(null);
        } else {
          setIntegrationIssue(null);
          setLoadError(status.detail || "Failed to load messages");
        }
      })
      .finally(finish);
  }, []);

  useEffect(() => {
    void loadPage(folder, 0);
  }, [folder, loadPage]);

  const handleFolderChange = (next: Folder) => {
    if (next === folder) return;
    setLoading(true);
    setFolder(next);
    setSelectedMessage(null);
    setModalOpen(false);
    setHasMore(false);
  };

  const openMessage = useCallback(
    async (msg: EmailMessage) => {
      // Optimistic read state for inbox
      if (folder === "inbox" && !msg.isRead) {
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
        outlookService.markAsRead(msg.id).catch(() => {});
      }
      setSelectedMessage(msg);
      setModalOpen(true);
    },
    [folder],
  );

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedMessage(null);
  }, []);

  const handleModalDeleted = useCallback(() => {
    void loadPage(folder, 0);
  }, [folder, loadPage]);

  const openCompose = (prefill?: ComposerPrefill) => {
    setComposerPrefill(prefill);
    setComposerOpen(true);
  };

  const handleComposeSent = useCallback(() => {
    // After sending: refresh Sent Items and the current folder.
    if (folder !== "sent") setFolder("sent");
    void loadPage(folder, 0);
  }, [folder, loadPage]);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <FeatureGate feature="outlook_email" featureLabel="Outlook Email" mode="replace">
      <div className="space-y-4">
        {integrationIssue && (
          <IntegrationStateBanner
            status={integrationIssue}
            onRetry={() => void loadPage(folder, 0)}
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
          <Button size="sm" onClick={() => openCompose()}>
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

          {/* Message list */}
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
              <>
                <div className="divide-y">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => void openMessage(message)}
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
                            {folder === "sent"
                              ? `To: ${message.to.map((t) => t.name || t.email).join(", ")}`
                              : message.sender.name || message.sender.email || "Unknown"}
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
                {hasMore && (
                  <div className="border-t p-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLoadingMore(true);
                        void loadPage(folder, messages.length);
                      }}
                      disabled={loadingMore}
                    >
                      {loadingMore ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                      Load more
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Email detail modal */}
        <EmailDetailModal
          open={modalOpen}
          onClose={handleModalClose}
          message={selectedMessage}
          folder={folder}
          onDeleted={handleModalDeleted}
        />

        <EmailComposer
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          prefill={composerPrefill}
          onSent={handleComposeSent}
        />
      </div>
    </FeatureGate>
  );
}
