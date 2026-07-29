import { z } from "zod/v4";

const emailAddress = z.object({
  name: z.string().max(256).optional().default(""),
  email: z.string().email("Invalid email address"),
}).strict();

const recipientList = z.array(emailAddress).min(1, "At least one recipient is required").max(50, "Too many recipients");

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
      content: z.string().min(1).max(1_048_576),
    }).strict(),
    toRecipients: recipientList,
    ccRecipients: z.array(emailAddress).max(50).optional().default([]),
    bccRecipients: z.array(emailAddress).max(50).optional().default([]),
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
  toRecipients: z.array(emailAddress).max(50).optional().default([]),
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
