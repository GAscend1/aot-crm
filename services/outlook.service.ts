import { v4 as uuid } from "uuid";
import type { EmailMessage, EmailAttachment, EmailTemplate } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";

class OutlookService {
  private messages: EmailMessage[] = [];
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
    return this.messages.filter((m) => {
      if (folder === "drafts") return m.isDraft;
      if (folder === "sent") return !m.isDraft;
      return !m.isDraft;
    });
  }

  async getMessage(id: string): Promise<EmailMessage | null> {
    return this.messages.find((m) => m.id === id) || null;
  }

  async send(data: {
    to: { name: string; email: string }[];
    cc?: { name: string; email: string }[];
    bcc?: { name: string; email: string }[];
    subject: string;
    body: string;
    attachments?: EmailAttachment[];
  }): Promise<EmailMessage> {
    const msg: EmailMessage = {
      id: uuid(),
      threadId: uuid(),
      subject: data.subject,
      body: data.body,
      bodyPreview: data.body.slice(0, 100),
      sender: { name: "Current User", email: "user@company.com" },
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
    this.messages.unshift(msg);
    eventBus.emit(Events.EMAIL_SENT, { to: data.to[0]?.email, subject: data.subject, entityId: msg.id });
    return msg;
  }

  async saveDraft(data: {
    to?: { name: string; email: string }[];
    subject?: string;
    body?: string;
  }): Promise<EmailMessage> {
    const msg: EmailMessage = {
      id: uuid(),
      threadId: uuid(),
      subject: data.subject || "No Subject",
      body: data.body || "",
      bodyPreview: (data.body || "").slice(0, 100),
      sender: { name: "Current User", email: "user@company.com" },
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
    this.messages.unshift(msg);
    eventBus.emit(Events.EMAIL_DRAFT_SAVED, { subject: data.subject, entityId: msg.id });
    return msg;
  }

  async reply(messageId: string, body: string): Promise<EmailMessage> {
    const original = this.messages.find((m) => m.id === messageId);
    if (!original) throw new Error("Message not found");

    return this.send({
      to: [original.sender],
      subject: `Re: ${original.subject}`,
      body,
    });
  }

  async replyAll(messageId: string, body: string): Promise<EmailMessage> {
    const original = this.messages.find((m) => m.id === messageId);
    if (!original) throw new Error("Message not found");

    return this.send({
      to: [original.sender, ...original.to],
      cc: original.cc,
      subject: `Re: ${original.subject}`,
      body,
    });
  }

  async forward(messageId: string, to: { name: string; email: string }[], body: string): Promise<EmailMessage> {
    const original = this.messages.find((m) => m.id === messageId);
    if (!original) throw new Error("Message not found");

    return this.send({
      to,
      subject: `Fw: ${original.subject}`,
      body: `${body}\n\n--- Original Message ---\n${original.body}`,
      attachments: original.attachments,
    });
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
    this.messages = this.messages.filter((m) => m.id !== id);
  }
}

export const outlookService = new OutlookService();
