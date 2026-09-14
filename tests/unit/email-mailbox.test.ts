import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { graphMessageToEmailMessage } from "../../services/outlook.service";

function graphItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "AAMkAD==123",
    conversationId: "conv-1",
    subject: "Proposal approval",
    body: { contentType: "html", content: "<p>Hi</p>" },
    bodyPreview: "Hi",
    sender: { emailAddress: { name: "Tom Baker", address: "customer@contoso.com" } },
    toRecipients: [{ emailAddress: { name: "Glenn Ugay", address: "glenn@aot.test" } }],
    ccRecipients: [],
    bccRecipients: [],
    hasAttachments: true,
    isRead: false,
    isDraft: false,
    importance: "normal",
    receivedDateTime: "2026-08-10T10:42:00Z",
    sentDateTime: "2026-08-10T10:40:00Z",
    categories: [],
    ...overrides,
  };
}

describe("graphMessageToEmailMessage (Graph → CRM mapping)", () => {
  it("maps recipients, read state, and timestamps", () => {
    const msg = graphMessageToEmailMessage(graphItem());
    expect(msg.id).toBe("AAMkAD==123");
    expect(msg.subject).toBe("Proposal approval");
    expect(msg.sender.name).toBe("Tom Baker");
    expect(msg.to[0].email).toBe("glenn@aot.test");
    expect(msg.isRead).toBe(false);
    expect(msg.receivedAt).toBe("2026-08-10T10:42:00Z");
  });

  it("maps embedded attachment metadata", () => {
    const msg = graphMessageToEmailMessage(
      graphItem({
        attachments: [
          { id: "att-1", name: "quote.pdf", contentType: "application/pdf", size: 2048 },
        ],
      }),
    );
    expect(msg.attachments).toHaveLength(1);
    expect(msg.attachments[0].name).toBe("quote.pdf");
    expect(msg.attachments[0].size).toBe(2048);
    expect(msg.hasAttachments).toBe(true);
  });

  it("maps cc + bcc recipients", () => {
    const msg = graphMessageToEmailMessage(
      graphItem({
        ccRecipients: [{ emailAddress: { address: "cc@aot.test" } }],
        bccRecipients: [{ emailAddress: { address: "bcc@aot.test" } }],
      }),
    );
    expect(msg.cc[0].email).toBe("cc@aot.test");
    expect(msg.bcc[0].email).toBe("bcc@aot.test");
  });

  it("marks a draft message as a draft", () => {
    expect(graphMessageToEmailMessage(graphItem({ isDraft: true })).isDraft).toBe(true);
  });
});

describe("EmailView mailbox behavior (static)", () => {
  const src = readFileSync(
    join(process.cwd(), "app", "(app)", "activities", "views", "EmailView.tsx"),
    "utf8",
  );
  const modalSrc = readFileSync(
    join(process.cwd(), "app", "(app)", "activities", "views", "EmailDetailModal.tsx"),
    "utf8",
  );

  it("paginates with Load more ($skip based)", () => {
    expect(src).toContain("Load more");
    expect(src).toContain("getMessages(target, skip)");
  });

  it("guards stale folder-switch requests", () => {
    expect(src).toContain("folderSeq");
    expect(src).toContain("a newer folder switch superseded this");
  });

  it("separates Graph connection failures from mailbox request failures", () => {
    expect(src).toContain('status.state === "SIGN_IN_REQUIRED"');
    expect(src).toContain("setLoadError(status.detail || \"Failed to load messages\")");
  });

  it("never falls back to the global 'Microsoft 365 unavailable' title for mailbox errors", () => {
    expect(src).not.toContain('?? "Microsoft 365 unavailable"');
    expect(src).not.toContain('>Microsoft 365 unavailable<');
  });

  it("opens drafts for editing and supports sending them", () => {
    expect(modalSrc).toContain("Open draft");
    expect(modalSrc).toContain("messageId: display.id");
  });

  it("renders email bodies safely via emailTextFromHtml (no raw HTML)", () => {
    expect(modalSrc).toContain("emailTextFromHtml");
    expect(modalSrc).not.toContain("dangerouslySetInnerHTML");
  });

  it("loads attachment metadata and downloads on demand only", () => {
    expect(modalSrc).toContain("getAttachments(message.id)");
    expect(modalSrc).toContain("attachmentContentUrl");
    expect(modalSrc).toContain("Download");
  });

  it("surfaces org-scoped CRM context with link actions", () => {
    expect(modalSrc).toContain("CRM context");
    expect(modalSrc).toContain("linkToRecord");
  });
});

describe("Mail API routes (static)", () => {
  it("messages route pages with $skip (bounded)", () => {
    const src = readFileSync(
      join(process.cwd(), "app", "api", "integrations", "microsoft", "mail", "messages", "route.ts"),
      "utf8",
    );
    expect(src).toContain("$skip");
    expect(src).toContain("Math.min(50,");
  });

  it("message route supports PATCH (mark-read + draft edits) via mailUpdateSchema", () => {
    const src = readFileSync(
      join(process.cwd(), "app", "api", "integrations", "microsoft", "mail", "[id]", "route.ts"),
      "utf8",
    );
    expect(src).toContain("export const PATCH");
    expect(src).toContain("mailUpdateSchema");
  });

  it("send-draft route forwards to Graph /send (never fakes success)", () => {
    const src = readFileSync(
      join(process.cwd(), "app", "api", "integrations", "microsoft", "mail", "[id]", "send", "route.ts"),
      "utf8",
    );
    expect(src).toContain("/send");
    expect(src).toContain("method: \"POST\"");
  });

  it("attachments route returns metadata only (no content)", () => {
    const src = readFileSync(
      join(process.cwd(), "app", "api", "integrations", "microsoft", "mail", "[id]", "attachments", "route.ts"),
      "utf8",
    );
    expect(src).toContain("$select=id,name,contentType,size,isInline");
  });
});
