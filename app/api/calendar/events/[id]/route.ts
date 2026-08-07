import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, subscriptionWriteGate } from "@/lib/server/api";
import {
  pushEventToGraph,
  deleteEventFromGraph,
  enqueueSyncJob,
  SYNC_STATUS,
} from "@/services/calendar-sync.service";
import { getGraphToken } from "@/services/graph-server";
import { calendarEventToUI } from "../route";
import { Prisma } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

const updateSchema = z
  .object({
    subject: z.string().min(1).optional(),
    body: z.string().optional(),
    start: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid start").optional(),
    end: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid end").optional(),
    isAllDay: z.boolean().optional(),
    location: z.string().optional(),
    timeZone: z.string().optional(),
    attendees: z.array(
      z.object({
        email: z.string().email("Invalid attendee email"),
        name: z.string().optional().default(""),
        status: z.string().optional().default("none"),
      })
    ).optional(),
    onlineMeeting: z.object({ provider: z.string().optional().default(""), url: z.string().optional().default("") }).optional(),
    reminder: z.number().int().min(0).max(43200).optional(),
  })
  .refine((d) => !(d.start && d.end) || new Date(d.end) > new Date(d.start), { message: "End must be after start", path: ["end"] });

async function getOwnedEvent(userId: string, id: string) {
  return prisma.calendarEvent.findFirst({ where: { id, userId } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const writeGate = await subscriptionWriteGate(user);
  if (writeGate) return writeGate;

  let parsed;
  try {
    parsed = updateSchema.parse(await request.json().catch(() => ({})));
  } catch (err) {
    if (err instanceof z.ZodError) {
      const first = err.issues[0];
      return NextResponse.json({ error: first?.message || "Invalid event" }, { status: 422 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const existing = await getOwnedEvent(user.id, id);
    if (!existing) return notFound("Event not found");

    const data: Prisma.CalendarEventUpdateInput = {};
    if (parsed.subject !== undefined) data.title = parsed.subject;
    if (parsed.body !== undefined) data.description = parsed.body || null;
    if (parsed.start !== undefined) data.startTime = new Date(parsed.start);
    if (parsed.end !== undefined) data.endTime = new Date(parsed.end);
    if (parsed.isAllDay !== undefined) data.allDay = parsed.isAllDay;
    if (parsed.location !== undefined) data.location = parsed.location || null;
    if (parsed.timeZone !== undefined) data.timeZone = parsed.timeZone;
    if (parsed.reminder !== undefined) data.reminderMinutes = parsed.reminder;
    if (parsed.attendees !== undefined) {
      data.attendees = parsed.attendees.length
        ? (parsed.attendees.map((a) => ({
            emailAddress: { name: a.name, address: a.email },
            type: "required",
            status: { response: a.status === "none" ? "none" : a.status },
          })) as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;
    }
    if (parsed.onlineMeeting?.url !== undefined) data.onlineMeetingUrl = parsed.onlineMeeting.url || null;

    // Local persist first — the CRM record survives any Graph outage.
    const updated = await prisma.calendarEvent.update({
      where: { id: existing.id },
      data: {
        ...data,
        graphSyncStatus: SYNC_STATUS.SYNCING,
        syncError: null,
      },
    });

    const graphEnabled = process.env.USE_MICROSOFT_GRAPH === "true";
    if (graphEnabled && updated.graphEventId) {
      try {
        const accessToken = await getGraphToken(request);
        const result = await pushEventToGraph(accessToken, updated);
        if (result.ok) {
          await prisma.calendarEvent.update({
            where: { id: existing.id },
            data: {
              graphSyncStatus: SYNC_STATUS.SYNCED,
              syncError: null,
              lastSyncedAt: new Date(),
              changeKey: result.changeKey ?? null,
            },
          });
        } else {
          await enqueueSyncJob(existing.id, user.id, "update", result.error);
          await prisma.calendarEvent.update({
            where: { id: existing.id },
            data: { graphSyncStatus: SYNC_STATUS.ERROR, syncError: result.error ?? "Sync pending retry", syncAttempts: { increment: 1 } },
          });
        }
      } catch (err) {
        await enqueueSyncJob(existing.id, user.id, "update", err instanceof Error ? err.message : "Graph unavailable");
        await prisma.calendarEvent.update({
          where: { id: existing.id },
          data: { graphSyncStatus: SYNC_STATUS.ERROR, syncError: "Graph unavailable — queued for retry", syncAttempts: { increment: 1 } },
        });
      }
    } else if (graphEnabled && !updated.graphEventId) {
      // Not yet pushed upstream (e.g. created while offline) — retry create.
      await enqueueSyncJob(existing.id, user.id, "create", "Not yet synced to Microsoft 365");
      await prisma.calendarEvent.update({
        where: { id: existing.id },
        data: { graphSyncStatus: SYNC_STATUS.ERROR, syncError: "Queued for first sync to Microsoft 365" },
      });
    } else {
      await prisma.calendarEvent.update({
        where: { id: existing.id },
        data: { graphSyncStatus: SYNC_STATUS.SYNCED, lastSyncedAt: new Date() },
      });
    }

    const fresh = await prisma.calendarEvent.findUniqueOrThrow({ where: { id: existing.id } });
    return NextResponse.json(calendarEventToUI(fresh));
  } catch (err) {
    logServerError(`PATCH /api/calendar/events/${id}`, err);
    return serverError("Failed to update event");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const writeGate = await subscriptionWriteGate(user);
  if (writeGate) return writeGate;

  try {
    const existing = await getOwnedEvent(user.id, id);
    if (!existing) return notFound("Event not found");

    // Try Graph first when we know the remote id; keep the CRM record marked
    // DELETED so the sync engine can retry deletion if the call fails.
    const graphEnabled = process.env.USE_MICROSOFT_GRAPH === "true";
    let graphOk = true;
    let graphError: string | null = null;

    if (graphEnabled && existing.graphEventId) {
      try {
        const accessToken = await getGraphToken(request);
        const result = await deleteEventFromGraph(accessToken, existing);
        graphOk = result.ok;
        graphError = result.error ?? null;
      } catch (err) {
        graphOk = false;
        graphError = err instanceof Error ? err.message : "Graph unavailable";
      }
    }

    if (graphOk) {
      await prisma.calendarEvent.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true });
    }

    // Graph failed — soft-delete locally and enqueue the remote deletion.
    await prisma.calendarEvent.update({
      where: { id: existing.id },
      data: { graphSyncStatus: SYNC_STATUS.DELETED, syncError: graphError ?? "Queued for deletion" },
    });
    await enqueueSyncJob(existing.id, user.id, "delete", graphError ?? undefined);

    return NextResponse.json({ success: true, deferred: true });
  } catch (err) {
    logServerError(`DELETE /api/calendar/events/${id}`, err);
    return serverError("Failed to delete event");
  }
}
