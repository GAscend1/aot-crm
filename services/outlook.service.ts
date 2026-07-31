import { v4 as uuid } from "uuid";
import type { EmailMessage, EmailAttachment, EmailTemplate } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";
import { graphApi, GraphClientError } from "./graph-client";
import { graphPendingError, isGraphPending } from "./integration-gate";

function toEmailMessage(item: Record<string, unknown>): EmailMessage {
  const sender = (item.sender as { emailAddress?: { name?: string; address?: string } })?.emailAddress;
  const toRecipients = (item.toRecipients as { emailAddress?: { name?: string; address?: string } }[]) || [];
  const ccRecipients = (item.ccRecipients as { emailAddress?: { name?: string; address?: string } }[]) || [];
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
    bcc: [],
    attachments: [],
    isRead: (item.isRead as boolean) ?? true,
    isDraft: (item.isDraft as boolean) ?? false,
    hasAttachments: (item.hasAttachments as boolean) ?? false,
    importance: (item.importance as "low" | "normal" | "high") || "normal",
    sentAt: (item.sentDateTime as string) || new Date().toISOString(),
    receivedAt: (item.receivedDateTime as string) || new Date().toISOString(),
    categories: (item.categories as string[]) || [],
  };
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

  async getMessages(folder = "inbox"): Promise<EmailMessage[]> {
    try {
      const folderMap: Record<string, string> = {
        inbox: "/me/mailFolders/inbox/messages",
        sent: "/me/mailFolders/sentItems/messages",
        drafts: "/me/mailFolders/drafts/messages",
      };
      const graphPath = folderMap[folder] || `/me/mailFolders/${folder}/messages`;
      const result = await graphApi(graphPath + "?$top=50&$orderby=receivedDateTime DESC") as { value: Record<string, unknown>[] };
      return (result.value || []).map(toEmailMessage);
    } catch (err) {
      if (isGraphPending(err)) throw graphPendingError("Microsoft Outlook");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to load messages: ${err.message}`);
      }
      throw new Error("Failed to load messages");
    }
  }

  async getMessage(id: string): Promise<EmailMessage | null> {
    try {
      const result = await graphApi(`/me/messages/${id}`) as Record<string, unknown>;
      return toEmailMessage(result);
    } catch (err) {
      if (isGraphPending(err)) throw graphPendingError("Microsoft Outlook");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to load message: ${err.message}`);
      }
      throw new Error("Failed to load message");
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
      const message = {
        message: {
          subject: data.subject,
          body: { contentType: "text", content: data.body },
          toRecipients: data.to.map((r) => ({ emailAddress: { address: r.email, name: r.name } })),
          ccRecipients: (data.cc || []).map((r) => ({ emailAddress: { address: r.email, name: r.name } })),
          bccRecipients: (data.bcc || []).map((r) => ({ emailAddress: { address: r.email, name: r.name } })),
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
        subject: data.subject,
        body: data.body,
        bodyPreview: data.body.slice(0, 100),
        sender: { name: "", email: "" },
        to: data.to,
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
      eventBus.emit(Events.EMAIL_SENT, { to: data.to[0]?.email, subject: data.subject, entityId: msg.id });
      return msg;
    } catch (err) {
      if (isGraphPending(err)) throw graphPendingError("Microsoft Outlook");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to send email: ${err.message}`);
      }
      throw new Error("Failed to send email");
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
      if (isGraphPending(err)) throw graphPendingError("Microsoft Outlook");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to save draft: ${err.message}`);
      }
      throw new Error("Failed to save draft");
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
      if (isGraphPending(err)) throw graphPendingError("Microsoft Outlook");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to reply: ${err.message}`);
      }
      throw new Error("Failed to reply");
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
      if (isGraphPending(err)) throw graphPendingError("Microsoft Outlook");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to reply all: ${err.message}`);
      }
      throw new Error("Failed to reply all");
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
      if (isGraphPending(err)) throw graphPendingError("Microsoft Outlook");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to forward: ${err.message}`);
      }
      throw new Error("Failed to forward");
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
      if (isGraphPending(err)) throw graphPendingError("Microsoft Outlook");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to delete message: ${err.message}`);
      }
      throw new Error("Failed to delete message");
    }
  }
}

export const outlookService = new OutlookService();
