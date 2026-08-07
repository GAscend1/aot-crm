import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, badRequest, subscriptionWriteGate } from "@/lib/server/api";
import {
  pushEventToGraph,
  enqueueSyncJob,
  SYNC_STATUS,
} from "@/services/calendar-sync.service";
import { getGraphToken } from "@/services/graph-server";
import type { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

/** Mirrors the client CalendarEvent shape (types/common.ts) for round-trips. */
export interface UICalendarEvent {
  id: string;
  subject: string;
  body: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location: string;
  onlineMeeting: { provider: string; url: string };
  attendees: { name: string; email: string; status: string }[];
  organizer: { name: string; email: string };
  showAs: "free" | "tentative" | "busy" | "oof" | "workingElsewhere" | "unknown";
  categories: string[];
  recurrence: string | null;
  reminder: number;
  createdAt: string;
  updatedAt: string;
  // Sync metadata surfaced to the UI.
  graphSyncStatus: string;
  syncError: string | null;
  lastSyncedAt: string | null;
  timeZone: string;
}

type Row = Prisma.CalendarEventGetPayload<Record<string, never>>;

export function calendarEventToUI(event: Row): UICalendarEvent {
  const attendees = (event.attendees as unknown as
    | { emailAddress: { name?: string; address: string }; type: string; status?: { response?: string } }[]
    | null) ?? [];
  const organizer = (event.organizer as unknown as { name?: string; email?: string } | null) ?? null;
  return {
    id: event.id,
    subject: event.title,
    body: event.description ?? "",
    start: event.startTime.toISOString(),
    end: event.endTime.toISOString(),
    isAllDay: event.allDay,
    location: event.location ?? "",
    onlineMeeting: event.onlineMeetingUrl
      ? { provider: "teams", url: event.onlineMeetingUrl }
      : { provider: "", url: "" },
    attendees: attendees.map((a) => ({
      name: a.emailAddress?.name ?? "",
      email: a.emailAddress?.address ?? "",
      status: a.status?.response ?? "none",
    })),
    organizer: {
      name: organizer?.name ?? "",
      email: organizer?.email ?? "",
    },
    showAs: "busy",
    categories: [],
    recurrence: null,
    reminder: event.reminderMinutes,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    graphSyncStatus: event.graphSyncStatus,
    syncError: event.syncError,
    lastSyncedAt: event.lastSyncedAt?.toISOString() ?? null,
    timeZone: event.timeZone,
  };
}

const createSchema = z
  .object({
    subject: z.string().min(1, "Subject is required"),
    body: z.string().optional().default(""),
    start: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid start"),
    end: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid end"),
    isAllDay: z.boolean().optional().default(false),
    location: z.string().optional().default(""),
    timeZone: z.string().optional().default("UTC"),
    attendees: z
      .array(
        z.object({
          email: z.string().email("Invalid attendee email"),
          name: z.string().optional().default(""),
          status: z.string().optional().default("none"),
        })
      )
      .optional()
      .default([]),
    onlineMeeting: z.object({ provider: z.string().optional().default(""), url: z.string().optional().default("") }).optional(),
    reminder: z.number().int().min(0).max(43200).optional().default(15),
    entityType: z.enum(["lead", "opportunity", "customer", "contact", "company"]).optional(),
    entityId: z.string().optional(),
  })
  .refine((d) => new Date(d.end) > new Date(d.start), { message: "End must be after start", path: ["end"] });

export async function GET(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const where: Prisma.CalendarEventWhereInput = { userId: user.id, organizationId: user.organizationId };
    if (start) where.startTime = { gte: new Date(start) };
    if (end) where.endTime = { lte: new Date(end) };
    if (searchParams.get("includeDeleted") !== "true") {
      where.graphSyncStatus = { not: SYNC_STATUS.DELETED };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json({ data: events.map(calendarEventToUI) });
  } catch (err) {
    logServerError("GET /api/calendar/events", err);
    return serverError("Failed to load events");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  const writeGate = await subscriptionWriteGate(user);
  if (writeGate) return writeGate;

  let parsed;
  try {
    parsed = createSchema.parse(await request.json().catch(() => ({})));
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return NextResponse.json({ error: first?.message || "Invalid event" }, { status: 422 });
    }
    return badRequest("Invalid request body");
  }

  try {
    // CalendarEvent links lead/opportunity/customer only (contact/company have
    // no calendar relation — those events surface via the company scope).
    const entityLink: Pick<
      Prisma.CalendarEventCreateInput,
      "lead" | "opportunity" | "customer"
    > = {};
    if (parsed.entityType && parsed.entityId) {
      const id = parsed.entityId;
      if (parsed.entityType === "lead") entityLink.lead = { connect: { id } };
      else if (parsed.entityType === "opportunity") entityLink.opportunity = { connect: { id } };
      else if (parsed.entityType === "customer") entityLink.customer = { connect: { id } };
    }

    const attendeesValue = parsed.attendees.length
      ? (parsed.attendees.map((a) => ({
          emailAddress: { name: a.name, address: a.email },
          type: "required",
          status: { response: a.status === "none" ? "none" : a.status },
        })) as unknown as Prisma.InputJsonValue)
      : undefined;

    const created = await prisma.calendarEvent.create({
      data: {
        title: parsed.subject,
        description: parsed.body || null,
        startTime: new Date(parsed.start),
        endTime: new Date(parsed.end),
        allDay: parsed.isAllDay,
        location: parsed.location || null,
        timeZone: parsed.timeZone,
        reminderMinutes: parsed.reminder,
        attendees: attendeesValue,
        onlineMeetingUrl: parsed.onlineMeeting?.url || null,
        graphSyncStatus: SYNC_STATUS.NOT_SYNCED,
        user: { connect: { id: user.id } },
        organization: { connect: { id: user.organizationId } },
        ...entityLink,
      },
    });

    // Best-effort push to Graph. Failure keeps the CRM record and enqueues retry.
    // The local CRM calendar always works; Graph mirroring requires the
    // `calendar_sync` plan entitlement.
    const graphEnabled = process.env.USE_MICROSOFT_GRAPH === "true";
    const { canUseFeature } = await import("@/lib/entitlements");
    const subscription = await prisma.subscription.findUnique({ where: { organizationId: user.organizationId } });
    const graphMirrorAllowed = graphEnabled && canUseFeature(subscription?.planCode ?? "", "calendar_sync");
    if (graphMirrorAllowed) {
      try {
        const accessToken = await getGraphToken(request);
        const result = await pushEventToGraph(accessToken, created);
        if (result.ok && result.graphEventId) {
          await prisma.calendarEvent.update({
            where: { id: created.id },
            data: {
              graphEventId: result.graphEventId,
              changeKey: result.changeKey ?? null,
              graphSyncStatus: SYNC_STATUS.SYNCED,
              syncError: null,
              lastSyncedAt: new Date(),
            },
          });
        } else {
          await enqueueSyncJob(created.id, user.id, "create", result.error);
          await prisma.calendarEvent.update({
            where: { id: created.id },
            data: { graphSyncStatus: SYNC_STATUS.ERROR, syncError: result.error ?? "Sync pending retry", syncAttempts: 1 },
          });
        }
      } catch (err) {
        await enqueueSyncJob(created.id, user.id, "create", err instanceof Error ? err.message : "Graph unavailable");
        await prisma.calendarEvent.update({
          where: { id: created.id },
          data: { graphSyncStatus: SYNC_STATUS.ERROR, syncError: "Graph unavailable — queued for retry", syncAttempts: 1 },
        });
      }
    }

    const fresh = await prisma.calendarEvent.findUniqueOrThrow({ where: { id: created.id } });
    return NextResponse.json(calendarEventToUI(fresh), { status: 201 });
  } catch (err) {
    logServerError("POST /api/calendar/events", err);
    return serverError("Failed to create event");
  }
}
