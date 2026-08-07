import { z } from "zod/v4";

// Graph recipient shape: each recipient is wrapped in an `emailAddress`
// object with `address` + optional `name`. These routes are thin proxies to
// Microsoft Graph, so the schemas must match the Graph wire format — a flat
// `{ name, email }` shape used to produce "Invalid input: expected string,
// received undefined" on every send because `email` was never present.
const graphEmailAddress = z.object({
  address: z.string().email("Invalid email address"),
  name: z.string().max(256).optional().default(""),
}).strict();

const graphRecipient = z.object({
  emailAddress: graphEmailAddress,
}).strict();

const recipientList = z.array(graphRecipient).min(1, "At least one recipient is required").max(50, "Too many recipients");

const optionalRecipientList = z.array(graphRecipient).max(50).optional().default([]);

const attachmentSchema = z.object({
  name: z.string().max(256),
  contentBytes: z.string().max(4_194_304, "Attachment too large"),
  contentType: z.string().max(256).optional(),
}).strict();

export const mailSendSchema = z.object({
  message: z.object({
    subject: z.string().min(1, "Subject is required").max(256),
    body: z.object({
      contentType: z.enum(["text", "html"]).optional().default("text"),
      // Graph accepts empty bodies; only the content type must be present.
      content: z.string().max(1_048_576).optional().default(""),
    }).strict(),
    toRecipients: recipientList,
    ccRecipients: optionalRecipientList,
    bccRecipients: optionalRecipientList,
    attachments: z.array(attachmentSchema).max(20).optional().default([]),
  }).strict(),
  saveToSentItems: z.boolean().optional().default(true),
}).strict();

export const mailDraftSchema = z.object({
  subject: z.string().max(256).optional().default(""),
  body: z.object({
    contentType: z.enum(["text", "html"]).optional().default("text"),
    content: z.string().max(1_048_576).optional().default(""),
  }).strict().optional(),
  toRecipients: optionalRecipientList,
}).strict();

export const mailReplySchema = z.object({
  comment: z.string().min(1, "Reply body is required").max(1_048_576),
}).strict();

export const mailReplyAllSchema = z.object({
  comment: z.string().min(1, "Reply body is required").max(1_048_576),
}).strict();

export const mailForwardSchema = z.object({
  message: z.object({
    toRecipients: recipientList,
  }).strict(),
  comment: z.string().max(1_048_576).optional().default(""),
}).strict();

/**
 * Accept either the Graph wire shape (`[{ emailAddress: { address, name } }]`)
 * or the flat convenience shape (`[{ name, email }]`) and normalize to the
 * Graph shape. Used by legacy/alternate clients before they migrate to the
 * Graph payload format.
 */
export function normalizeRecipientsToGraph(
  recipients: { emailAddress?: { address?: string; name?: string }; name?: string; email?: string }[] | undefined,
): { emailAddress: { address: string; name: string } }[] {
  if (!Array.isArray(recipients)) return [];
  return recipients
    .map((r) => {
      const address = (r.emailAddress?.address ?? r.email ?? "").trim();
      const name = r.emailAddress?.name ?? r.name ?? "";
      if (!address) return null;
      return { emailAddress: { address, name } };
    })
    .filter((r): r is { emailAddress: { address: string; name: string } } => r !== null);
}

const supportedTimeZones = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Berlin", "Europe/Paris",
  "Europe/Moscow", "Asia/Tokyo", "Asia/Shanghai", "Asia/Singapore", "Asia/Kolkata",
  "Australia/Sydney", "Pacific/Auckland", "Brazil/East",
];

const calendarBaseSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(256),
  body: z.object({
    contentType: z.enum(["text", "html"]).optional().default("text"),
    content: z.string().max(1_048_576).optional().default(""),
  }).strict().optional(),
  start: z.object({
    dateTime: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid start date/time"),
    timeZone: z.enum(supportedTimeZones as [string, ...string[]]).optional().default("UTC"),
  }).strict(),
  end: z.object({
    dateTime: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid end date/time"),
    timeZone: z.enum(supportedTimeZones as [string, ...string[]]).optional().default("UTC"),
  }).strict(),
  location: z.string().max(256).optional().default(""),
  attendees: z.array(z.object({
    emailAddress: z.object({
      address: z.string().email("Invalid attendee email"),
      name: z.string().max(256).optional().default(""),
    }).strict(),
    type: z.enum(["required", "optional", "resource"]).optional().default("required"),
  }).strict()).max(50).optional().default([]),
  showAs: z.enum(["free", "tentative", "busy", "oof", "workingElsewhere"]).optional().default("busy"),
  categories: z.array(z.string().max(64)).max(10).optional().default([]),
  isOnlineMeeting: z.boolean().optional().default(false),
  onlineMeetingProvider: z.enum(["teamsForBusiness"]).optional(),
  isReminderOn: z.boolean().optional().default(true),
  reminderMinutesBeforeStart: z.number().int().min(0).max(43200).optional().default(15),
}).strict();

export const calendarCreateSchema = calendarBaseSchema.refine(
  (data) => new Date(data.end.dateTime) > new Date(data.start.dateTime),
  { message: "End time must be after start time", path: ["end"] },
);

export const calendarUpdateSchema = z.object({
  subject: z.string().min(1).max(256).optional(),
  body: z.object({
    contentType: z.enum(["text", "html"]).optional().default("text"),
    content: z.string().max(1_048_576).optional().default(""),
  }).strict().optional(),
  start: z.object({
    dateTime: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid start date/time"),
    timeZone: z.enum(supportedTimeZones as [string, ...string[]]).optional().default("UTC"),
  }).strict().optional(),
  end: z.object({
    dateTime: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid end date/time"),
    timeZone: z.enum(supportedTimeZones as [string, ...string[]]).optional().default("UTC"),
  }).strict().optional(),
  location: z.string().max(256).optional(),
  attendees: z.array(z.object({
    emailAddress: z.object({
      address: z.string().email("Invalid attendee email"),
      name: z.string().max(256).optional().default(""),
    }).strict(),
    type: z.enum(["required", "optional", "resource"]).optional().default("required"),
  }).strict()).max(50).optional(),
  showAs: z.enum(["free", "tentative", "busy", "oof", "workingElsewhere"]).optional(),
  categories: z.array(z.string().max(64)).max(10).optional(),
  isOnlineMeeting: z.boolean().optional(),
  onlineMeetingProvider: z.enum(["teamsForBusiness"]).optional(),
  isReminderOn: z.boolean().optional(),
  reminderMinutesBeforeStart: z.number().int().min(0).max(43200).optional(),
}).strict().refine(
  (data) => {
    if (data.start && data.end) {
      return new Date(data.end.dateTime) > new Date(data.start.dateTime);
    }
    return true;
  },
  { message: "End time must be after start time", path: ["end"] },
);

export const messageIdSchema = z.string().regex(/^[A-Za-z0-9=_-]+$/, "Invalid message ID");

export const eventIdSchema = z.string().min(1, "Event ID is required").regex(/^[A-Za-z0-9=_-]+$/, "Invalid event ID");
