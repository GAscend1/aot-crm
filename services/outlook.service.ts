import { v4 as uuid } from "uuid";
import type { EmailMessage, EmailAttachment, EmailTemplate } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";
import { EMAIL_PAGE_SIZE } from "@/lib/email-utils";
import { graphApi } from "./graph-client";
import { toGraphClientError } from "./integration-gate";

/** Map a Graph message item into the CRM EmailMessage shape (exported for tests). */
export function graphMessageToEmailMessage(item: Record<string, unknown>): EmailMessage {
  const sender = (item.sender as { emailAddress?: { name?: string; address?: string } })?.emailAddress;
  const toRecipients = (item.toRecipients as { emailAddress?: { name?: string; address?: string } }[]) || [];
  const ccRecipients = (item.ccRecipients as { emailAddress?: { name?: string; address?: string } }[]) || [];
  const bccRecipients = (item.bccRecipients as { emailAddress?: { name?: string; address?: string } }[]) || [];
  const attachments = (item.attachments as Record<string, unknown>[] | undefined) || [];
  return {
    id: (item.id as string) || uuid(),
    threadId: (item.conversationId as string) || uuid(),
    subject: (item.subject as string) || "",
    body: ((item.body as { content?: string })?.content) || "",
    bodyPreview: (item.bodyPreview as string) || "",
    sender: {
      name: sender?.name || "Unknown",
      email: sender?.address || "",
    },
    to: toRecipients.map((r) => ({
      name: r.emailAddress?.name || "",
      email: r.emailAddress?.address || "",
    })),
    cc: ccRecipients.map((r) => ({
      name: r.emailAddress?.name || "",
      email: r.emailAddress?.address || "",
    })),
    bcc: bccRecipients.map((r) => ({
      name: r.emailAddress?.name || "",
      email: r.emailAddress?.address || "",
    })),
    attachments: attachments.map((a) => ({
      id: String(a.id ?? ""),
      name: String(a.name ?? ""),
      contentType: String(a.contentType ?? ""),
      size: Number(a.size ?? 0),
      contentBytes: a.contentBytes ? String(a.contentBytes) : undefined,
    })),
    isRead: (item.isRead as boolean) ?? true,
    isDraft: (item.isDraft as boolean) ?? false,
    hasAttachments: (item.hasAttachments as boolean) ?? (attachments.length > 0),
    importance: (item.importance as "low" | "normal" | "high") || "normal",
    sentAt: (item.sentDateTime as string) || new Date().toISOString(),
    receivedAt: (item.receivedDateTime as string) || new Date().toISOString(),
    categories: (item.categories as string[]) || [],
  };
}

function toEmailMessage(item: Record<string, unknown>): EmailMessage {
  return graphMessageToEmailMessage(item);
}

class OutlookService {
  private templates: EmailTemplate[] = [
    {
      id: "tpl-1",
      name: "Follow Up",
      subject: "Following up on our conversation",
      body: "Hi {{contact}},\n\nI wanted to follow up on our recent conversation regarding {{topic}}.\n\nBest regards,\n{{user}}",
      category: "Sales",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tpl-2",
      name: "Meeting Request",
      subject: "Meeting Request: {{topic}}",
      body: "Hi {{contact}},\n\nI would like to schedule a meeting to discuss {{topic}}.\n\nWould {{date}} work for you?\n\nBest regards,\n{{user}}",
      category: "Meetings",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tpl-3",
      name: "Thank You",
      subject: "Thank you",
      body: "Hi {{contact}},\n\nThank you for your time today. I appreciate the opportunity to discuss {{topic}}.\n\nBest regards,\n{{user}}",
      category: "Sales",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  /**
   * Load one page of a folder. $skip-based paging keeps the mailbox bounded
   * and never exposes opaque Graph continuation tokens to the browser.
   */
  async getMessages(
    folder = "inbox",
    skip = 0,
  ): Promise<{ messages: EmailMessage[]; hasMore: boolean }> {
    try {
      const folderMap: Record<string, string> = {
        inbox: "/me/mailFolders/inbox/messages",
        sent: "/me/mailFolders/sentItems/messages",
        drafts: "/me/mailFolders/drafts/messages",
      };
      const graphPath = folderMap[folder] || `/me/mailFolders/${folder}/messages`;
      const result = await graphApi(
        `${graphPath}?$top=${EMAIL_PAGE_SIZE}&$skip=${skip}&$orderby=receivedDateTime DESC`
      ) as { value: Record<string, unknown>[] };
      const messages = (result.value || []).map(toEmailMessage);
      return { messages, hasMore: messages.length >= EMAIL_PAGE_SIZE };
    } catch (err) {
      throw toGraphClientError(err, "Failed to load messages");
    }
  }

  async getMessage(id: string): Promise<EmailMessage | null> {
    try {
      const result = await graphApi(`/me/messages/${id}`) as Record<string, unknown>;
      return toEmailMessage(result);
    } catch (err) {
      throw toGraphClientError(err, "Failed to load message");
    }
  }

  async send(data: {
    to: { name: string; email: string }[];
    cc?: { name: string; email: string }[];
    bcc?: { name: string; email: string }[];
    subject: string;
    body: string;
    attachments?: EmailAttachment[];
  }): Promise<EmailMessage> {
    try {
      // Normalize the payload at the boundary so `undefined`/empty values can
      // never reach the strict server schema ("expected string, received
      // undefined"). Recipients without an address are dropped; if nothing
      // remains, fail fast with a clear client-side message.
      const to = (data.to || [])
        .map((r) => ({ name: r.name || "", email: (r.email || "").trim() }))
        .filter((r) => r.email.length > 0);
      if (to.length === 0) {
        throw new Error("At least one recipient is required.");
      }
      const subject = (data.subject || "").trim();
      if (!subject) {
        throw new Error("Subject is required.");
      }
      const body = data.body || "";

      const attachments = (data.attachments || [])
        .filter((a) => a.contentBytes)
        .map((a) => ({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: a.name,
          contentType: a.contentType || "application/octet-stream",
          contentBytes: a.contentBytes,
        }));

      const message = {
        message: {
          subject,
          body: { contentType: "text", content: body },
          toRecipients: to.map((r) => ({ emailAddress: { address: r.email, name: r.name } })),
          ccRecipients: (data.cc || [])
            .map((r) => ({ emailAddress: { address: (r.email || "").trim(), name: r.name || "" } }))
            .filter((r) => r.emailAddress.address.length > 0),
          bccRecipients: (data.bcc || [])
            .map((r) => ({ emailAddress: { address: (r.email || "").trim(), name: r.name || "" } }))
            .filter((r) => r.emailAddress.address.length > 0),
          attachments,
        },
        saveToSentItems: true,
      };
      await graphApi("/me/sendMail", {
        method: "POST",
        body: JSON.stringify(message),
      });
      const msg: EmailMessage = {
        id: uuid(),
        threadId: uuid(),
        subject,
        body,
        bodyPreview: body.slice(0, 100),
        sender: { name: "", email: "" },
        to,
        cc: data.cc || [],
        bcc: data.bcc || [],
        attachments: data.attachments || [],
        isRead: true,
        isDraft: false,
        hasAttachments: (data.attachments?.length || 0) > 0,
        importance: "normal",
        sentAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        categories: [],
      };
      eventBus.emit(Events.EMAIL_SENT, { to: to[0]?.email, subject, entityId: msg.id });
      return msg;
    } catch (err) {
      throw toGraphClientError(err, "Failed to send email");
    }
  }

  async saveDraft(data: {
    to?: { name: string; email: string }[];
    subject?: string;
    body?: string;
  }): Promise<EmailMessage> {
    try {
      const draft = {
        subject: data.subject || "",
        body: { contentType: "text", content: data.body || "" },
        toRecipients: (data.to || []).map((r) => ({ emailAddress: { address: r.email, name: r.name } })),
      };
      const result = await graphApi("/me/messages", {
        method: "POST",
        body: JSON.stringify(draft),
      }) as Record<string, unknown>;
      const msg: EmailMessage = {
        id: (result.id as string) || uuid(),
        threadId: uuid(),
        subject: data.subject || "No Subject",
        body: data.body || "",
        bodyPreview: (data.body || "").slice(0, 100),
        sender: { name: "", email: "" },
        to: data.to || [],
        cc: [],
        bcc: [],
        attachments: [],
        isRead: true,
        isDraft: true,
        hasAttachments: false,
        importance: "normal",
        sentAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        categories: [],
      };
      eventBus.emit(Events.EMAIL_DRAFT_SAVED, { subject: data.subject, entityId: msg.id });
      return msg;
    } catch (err) {
      throw toGraphClientError(err, "Failed to save draft");
    }
  }

  async reply(messageId: string, body: string): Promise<EmailMessage> {
    try {
      const reply = { comment: body };
      await graphApi(`/me/messages/${messageId}/reply`, {
        method: "POST",
        body: JSON.stringify(reply),
      });
      const msg: EmailMessage = {
        id: uuid(), threadId: uuid(), subject: "Re: ", body, bodyPreview: body.slice(0, 100),
        sender: { name: "", email: "" }, to: [], cc: [], bcc: [],
        attachments: [], isRead: true, isDraft: false, hasAttachments: false,
        importance: "normal", sentAt: new Date().toISOString(), receivedAt: new Date().toISOString(),
        categories: [],
      };
      eventBus.emit(Events.EMAIL_SENT, { entityId: msg.id });
      return msg;
    } catch (err) {
      throw toGraphClientError(err, "Failed to reply");
    }
  }

  async replyAll(messageId: string, body: string): Promise<EmailMessage> {
    try {
      const replyAll = { comment: body };
      await graphApi(`/me/messages/${messageId}/replyAll`, {
        method: "POST",
        body: JSON.stringify(replyAll),
      });
      const msg: EmailMessage = {
        id: uuid(), threadId: uuid(), subject: "Re: ", body, bodyPreview: body.slice(0, 100),
        sender: { name: "", email: "" }, to: [], cc: [], bcc: [],
        attachments: [], isRead: true, isDraft: false, hasAttachments: false,
        importance: "normal", sentAt: new Date().toISOString(), receivedAt: new Date().toISOString(),
        categories: [],
      };
      eventBus.emit(Events.EMAIL_SENT, { entityId: msg.id });
      return msg;
    } catch (err) {
      throw toGraphClientError(err, "Failed to reply all");
    }
  }

  async forward(messageId: string, to: { name: string; email: string }[], body: string): Promise<EmailMessage> {
    try {
      const forwardPayload = {
        message: {
          toRecipients: to.map((r) => ({ emailAddress: { address: r.email, name: r.name } })),
        },
        comment: body,
      };
      await graphApi(`/me/messages/${messageId}/forward`, {
        method: "POST",
        body: JSON.stringify(forwardPayload),
      });
      const msg: EmailMessage = {
        id: uuid(), threadId: uuid(), subject: "Fw: ", body, bodyPreview: body.slice(0, 100),
        sender: { name: "", email: "" }, to, cc: [], bcc: [],
        attachments: [], isRead: true, isDraft: false, hasAttachments: false,
        importance: "normal", sentAt: new Date().toISOString(), receivedAt: new Date().toISOString(),
        categories: [],
      };
      eventBus.emit(Events.EMAIL_SENT, { entityId: msg.id });
      return msg;
    } catch (err) {
      throw toGraphClientError(err, "Failed to forward");
    }
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    return this.templates;
  }

  async saveTemplate(template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">): Promise<EmailTemplate> {
    const tpl: EmailTemplate = {
      ...template,
      id: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.push(tpl);
    return tpl;
  }

  async updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const idx = this.templates.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Template not found");
    const updated = { ...this.templates[idx], ...data, updatedAt: new Date().toISOString() };
    this.templates[idx] = updated;
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    this.templates = this.templates.filter((t) => t.id !== id);
  }

  async deleteMessage(id: string): Promise<void> {
    try {
      await graphApi(`/me/messages/${id}`, { method: "DELETE" });
    } catch (err) {
      throw toGraphClientError(err, "Failed to delete message");
    }
  }

  /** Mark a message as read via Graph. */
  async markAsRead(id: string): Promise<void> {
    try {
      await graphApi(`/me/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: true }),
      });
    } catch (err) {
      throw toGraphClientError(err, "Failed to update message");
    }
  }

  /** Update an existing draft (subject/body/recipients). */
  async updateDraft(
    id: string,
    data: {
      to?: { name: string; email: string }[];
      subject?: string;
      body?: string;
    },
  ): Promise<void> {
    try {
      const body: Record<string, unknown> = {
        subject: data.subject ?? undefined,
        body: data.body !== undefined ? { contentType: "text", content: data.body } : undefined,
        toRecipients: (data.to ?? []).map((r) => ({ emailAddress: { address: r.email, name: r.name } })),
      };
      await graphApi(`/me/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw toGraphClientError(err, "Failed to update draft");
    }
  }

  /** Send an existing draft. Only resolves after Graph confirms the send. */
  async sendDraft(id: string): Promise<void> {
    try {
      await graphApi(`/me/messages/${id}/send`, { method: "POST" });
    } catch (err) {
      throw toGraphClientError(err, "Failed to send draft");
    }
  }

  /** Attachment metadata for a message (no content). */
  async getAttachments(messageId: string): Promise<EmailAttachment[]> {
    try {
      const result = await graphApi(`/me/messages/${messageId}/attachments`) as { value?: Record<string, unknown>[] };
      return (result.value || []).map((a) => ({
        id: String(a.id ?? ""),
        name: String(a.name ?? ""),
        contentType: String(a.contentType ?? ""),
        size: Number(a.size ?? 0),
      }));
    } catch (err) {
      throw toGraphClientError(err, "Failed to load attachments");
    }
  }

  /**
   * Signed-in download URL for an attachment's content. The browser GETs this
   * route with its session cookie; the server re-authenticates and streams the
   * bytes from Graph. Content is only fetched on explicit download.
   */
  attachmentContentUrl(messageId: string, attachmentId: string, name: string): string {
    const params = new URLSearchParams({ name });
    return `/api/integrations/microsoft/mail/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}/content?${params.toString()}`;
  }

  /** Org-scoped CRM records matching the email's addresses. */
  async getEmailContext(addresses: string[]): Promise<EmailContextMatch[]> {
    const params = new URLSearchParams();
    addresses.slice(0, 20).forEach((a) => params.append("addresses", a));
    const res = await fetch(`/api/email/context?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json().catch(() => ({ matches: [] }))) as { matches?: EmailContextMatch[] };
    return body.matches ?? [];
  }

  /** Explicitly link an email to a CRM record (creates an Email activity). */
  async linkEmailToRecord(input: EmailLinkInput): Promise<{ id: string; duplicate?: boolean }> {
    const res = await fetch("/api/email/associate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(String(body.error ?? "Failed to link email to record"));
    }
    return { id: String(body.id ?? ""), duplicate: Boolean(body.duplicate) };
  }

  /** Existing CRM Email activities for a Graph message id. */
  async getEmailAssociations(messageId: string): Promise<EmailAssociation[]> {
    const res = await fetch(`/api/email/associations?messageId=${encodeURIComponent(messageId)}`, { cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json().catch(() => ({ data: [] }))) as { data?: EmailAssociation[] };
    return body.data ?? [];
  }
}

export interface EmailContextMatch {
  kind: "contact" | "customer" | "lead" | "company";
  id: string;
  name: string;
  email: string;
  company?: string;
  href: string;
}

export interface EmailLinkInput {
  messageId: string;
  subject: string;
  description?: string;
  senderEmail?: string;
  senderName?: string;
  receivedAt?: string;
  entityType: "contact" | "company" | "lead" | "opportunity" | "customer";
  entityId: string;
}

export interface EmailAssociation {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  subject: string;
  linkedAt: string;
}

export const outlookService = new OutlookService();
