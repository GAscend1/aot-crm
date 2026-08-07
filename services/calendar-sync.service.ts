import { prisma } from "@/lib/prisma";
import { graphFetch, GraphServerError } from "./graph-server";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Microsoft Graph calendar synchronization engine (Phase 5 — Unified Activity
 * Center). Server-only module: imports `lib/prisma` so it must never be
 * imported from client components.
 *
 * Design goals:
 *  - CRM is the source of truth for locally-created events; Graph is the
 *    external mirror. Local-first: every write persists locally BEFORE the
 *    Graph call, so a Graph outage never loses the CRM record.
 *  - Failures are recorded on the event (`syncError`, `syncAttempts`) and
 *    enqueued in `CalendarSyncJob` for retry with backoff.
 *  - `graphEventId` (unique) is the bidirectional key → duplicate prevention.
 *  - Delta pulls use the per-user `CalendarDeltaState.deltaLink` cursor.
 */

export const SYNC_STATUS = {
  NOT_SYNCED: "NOT_SYNCED",
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  ERROR: "ERROR",
  DELETED: "DELETED",
} as const;

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BACKOFF_MINUTES = 15;

export interface GraphAttendee {
  emailAddress: { name?: string; address: string };
  type: "required" | "optional" | "resource";
  status?: { response?: string };
}

export interface GraphEventPayload {
  subject: string;
  body?: { contentType: "text" | "html"; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  attendees?: GraphAttendee[];
  showAs?: string;
  categories?: string[];
  isReminderOn?: boolean;
  reminderMinutesBeforeStart?: number;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: "teamsForBusiness";
  onlineMeetingUrl?: string;
}

export interface GraphEvent {
  id: string;
  changeKey?: string;
  subject: string;
  body?: { contentType?: string; content?: string };
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  location?: { displayName?: string };
  attendees?: GraphAttendee[];
  organizer?: { emailAddress?: { name?: string; address?: string } };
  isAllDay?: boolean;
  isOnlineMeeting?: boolean;
  onlineMeeting?: { joinUrl?: string };
  showAs?: string;
  categories?: string[];
  isReminderOn?: boolean;
  reminderMinutesBeforeStart?: number;
  "@removed"?: { reason?: string };
}

type CalendarEventRow = Prisma.CalendarEventGetPayload<Record<string, never>>;

/* ------------------------------------------------------------------ */
/* 1. Push: CRM → Graph                                               */
/* ------------------------------------------------------------------ */

/** Builds the Graph API request payload from a local event (exported for tests). */
export function buildGraphPayload(event: CalendarEventRow): GraphEventPayload {
  const timeZone = event.timeZone || "UTC";
  const startIso = event.allDay ? event.startTime.toISOString() : event.startTime.toISOString();
  const endIso = event.allDay ? event.endTime.toISOString() : event.endTime.toISOString();

  const payload: GraphEventPayload = {
    subject: event.title,
    body: event.description
      ? { contentType: "text", content: event.description }
      : undefined,
    start: { dateTime: startIso, timeZone },
    end: { dateTime: endIso, timeZone },
    location: event.location ? { displayName: event.location } : undefined,
    showAs: "busy",
    isReminderOn: event.reminderMinutes > 0,
    reminderMinutesBeforeStart: event.reminderMinutes || 15,
  };

  const attendees = event.attendees as GraphAttendee[] | null;
  if (attendees && attendees.length > 0) {
    payload.attendees = attendees;
  }

  if (event.onlineMeetingUrl) {
    payload.isOnlineMeeting = true;
    payload.onlineMeetingProvider = "teamsForBusiness";
  }

  return payload;
}

/** Push a single local event to Graph (create or update). Never throws to the caller — returns the outcome. */
export async function pushEventToGraph(
  accessToken: string,
  event: CalendarEventRow,
): Promise<{ ok: boolean; error?: string; graphEventId?: string; changeKey?: string }> {
  const payload = buildGraphPayload(event);
  try {
    const result = (await graphFetch(accessToken, event.graphEventId
      ? `/me/events/${event.graphEventId}`
      : "/me/events", {
      method: event.graphEventId ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    })) as GraphEvent;

    return {
      ok: true,
      graphEventId: result.id,
      changeKey: result.changeKey,
    };
  } catch (err) {
    const message =
      err instanceof GraphServerError ? err.message : err instanceof Error ? err.message : "Unknown Graph error";
    // A deleted upstream event (404/410) — clear the stale link so a later
    // retry recreates instead of failing forever.
    if (err instanceof GraphServerError && (err.status === 404 || err.status === 410)) {
      return { ok: false, error: message, graphEventId: event.graphEventId ?? undefined };
    }
    return { ok: false, error: message };
  }
}

/** Delete an event from Graph. Never throws. */
export async function deleteEventFromGraph(
  accessToken: string,
  event: CalendarEventRow,
): Promise<{ ok: boolean; error?: string }> {
  if (!event.graphEventId) return { ok: true };
  try {
    await graphFetch(accessToken, `/me/events/${event.graphEventId}`, { method: "DELETE" });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof GraphServerError ? err.message : err instanceof Error ? err.message : "Unknown Graph error";
    return { ok: false, error: message };
  }
}

/* ------------------------------------------------------------------ */
/* 2. Pull: Graph → CRM (delta sync)                                  */
/* ------------------------------------------------------------------ */

function isoFromGraphDateTime(value?: { dateTime?: string; timeZone?: string }): Date | null {
  if (!value?.dateTime) return null;
  const parsed = new Date(value.dateTime);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Pull a page of Graph events and apply them to the local mirror.
 * Deduplication: matches by unique `graphEventId`; upserts on changeKey change.
 */
async function applyGraphEvents(
  userId: string,
  organizationId: string,
  accessToken: string,
  deltaLink: string | null,
): Promise<{ imported: number; updated: number; removed: number; nextDeltaLink: string }> {
  let url: string | null =
    deltaLink ??
    "/me/calendarview?startDateTime=2000-01-01T00:00:00Z&endDateTime=2100-01-01T00:00:00Z&$select=id,changeKey,subject,body,start,end,location,attendees,organizer,isAllDay,isOnlineMeeting,onlineMeeting,showAs,categories,isReminderOn,reminderMinutesBeforeStart";

  let imported = 0;
  let updated = 0;
  let removed = 0;
  let nextDeltaLink = deltaLink ?? "";

  for (let page = 0; page < 20; page++) {
    if (!url) break;
    const result = (await graphFetch(accessToken, url)) as {
      value?: GraphEvent[];
      "@odata.nextLink"?: string;
      "@odata.deltaLink"?: string;
    };

    for (const item of result.value ?? []) {
      if (!item.id) continue;
      const existing = await prisma.calendarEvent.findUnique({
        where: { graphEventId: item.id },
      });

      // Deleted upstream — remove local mirror copy (soft: mark DELETED + enqueue cleanup).
      if (item["@removed"]) {
        if (existing) {
          await prisma.calendarEvent.update({
            where: { id: existing.id },
            data: {
              graphSyncStatus: SYNC_STATUS.DELETED,
              syncError: "Deleted in Microsoft 365",
              lastSyncedAt: new Date(),
            },
          });
          removed++;
        }
        continue;
      }

      const start = isoFromGraphDateTime(item.start);
      const end = isoFromGraphDateTime(item.end);
      if (!start || !end) continue;

      const attendees = item.attendees?.map((a) => ({
        emailAddress: {
          name: a.emailAddress?.name ?? "",
          address: a.emailAddress?.address ?? "",
        },
        type: a.type ?? "required",
        status: a.status,
      }));
      const organizer = item.organizer?.emailAddress
        ? {
            name: item.organizer.emailAddress.name ?? "",
            email: item.organizer.emailAddress.address ?? "",
          }
        : null;
      const onlineMeetingUrl =
        item.onlineMeeting?.joinUrl ?? null;
      const timeZone = item.start?.timeZone ?? "UTC";

      const data = {
        title: item.subject || "Untitled event",
        description: item.body?.content ?? null,
        startTime: start,
        endTime: end,
        allDay: item.isAllDay ?? false,
        location: item.location?.displayName ?? null,
        timeZone,
        attendees: attendees && attendees.length > 0 ? (attendees as unknown as Prisma.InputJsonValue) : undefined,
        organizer: organizer as unknown as Prisma.InputJsonValue | undefined,
        onlineMeetingUrl,
        changeKey: item.changeKey ?? null,
        graphSyncStatus: SYNC_STATUS.SYNCED,
        syncError: null,
        lastSyncedAt: new Date(),
        userId,
        organizationId,
      };

      if (existing) {
        if (existing.changeKey === item.changeKey && existing.graphSyncStatus !== SYNC_STATUS.ERROR) {
          continue; // unchanged — skip
        }
        await prisma.calendarEvent.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.calendarEvent.create({
          data: {
            ...data,
            graphEventId: item.id,
          },
        });
        imported++;
      }
    }

    // Resume delta where Graph told us to.
    if (result["@odata.deltaLink"]) {
      nextDeltaLink = result["@odata.deltaLink"];
      url = null;
      break;
    }
    url = result["@odata.nextLink"] ?? null;
  }

  return { imported, updated, removed, nextDeltaLink };
}

/** Run a full delta sync for a user (pull). Never throws. */
export async function pullCalendarDelta(
  accessToken: string,
  userId: string,
): Promise<{ imported: number; updated: number; removed: number; lastSyncAt: Date; error?: string }> {
  const state = await prisma.calendarDeltaState.findUnique({ where: { userId } });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
  if (!user) {
    return { imported: 0, updated: 0, removed: 0, lastSyncAt: new Date(), error: "User not found" };
  }
  try {
    const result = await applyGraphEvents(userId, user.organizationId, accessToken, state?.deltaLink ?? null);

    const lastSyncAt = new Date();
    await prisma.calendarDeltaState.upsert({
      where: { userId },
      update: { deltaLink: result.nextDeltaLink, lastSyncAt },
      create: { userId, deltaLink: result.nextDeltaLink, lastSyncAt },
    });

    return { ...result, lastSyncAt };
  } catch (err) {
    // 410 Gone (or malformed delta) means the delta cursor expired — clear it
    // and fall back to one full resync so sync recovers without manual help.
    if (err instanceof GraphServerError && (err.status === 410 || err.status === 400)) {
      try {
        await prisma.calendarDeltaState.deleteMany({ where: { userId } });
        const result = await applyGraphEvents(userId, user.organizationId, accessToken, null);
        const lastSyncAt = new Date();
        await prisma.calendarDeltaState.upsert({
          where: { userId },
          update: { deltaLink: result.nextDeltaLink, lastSyncAt },
          create: { userId, deltaLink: result.nextDeltaLink, lastSyncAt },
        });
        return { ...result, lastSyncAt };
      } catch (retryErr) {
        const message =
          retryErr instanceof GraphServerError
            ? retryErr.message
            : retryErr instanceof Error
              ? retryErr.message
              : "Delta sync failed";
        return { imported: 0, updated: 0, removed: 0, lastSyncAt: new Date(), error: message };
      }
    }

    const message =
      err instanceof GraphServerError ? err.message : err instanceof Error ? err.message : "Delta sync failed";
    return { imported: 0, updated: 0, removed: 0, lastSyncAt: new Date(), error: message };
  }
}

/* ------------------------------------------------------------------ */
/* 3. Retry queue                                                     */
/* ------------------------------------------------------------------ */

export async function enqueueSyncJob(
  eventId: string,
  userId: string,
  action: "create" | "update" | "delete",
  error?: string,
): Promise<void> {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    const attempts = event?.syncAttempts ?? 0;
    const shouldCreate = action === "create" && !!event?.graphEventId;
    await prisma.calendarSyncJob.create({
      data: {
        eventId,
        userId,
        action: shouldCreate ? "update" : action,
        status: "pending",
        lastError: error ?? null,
        nextAttemptAt: new Date(Date.now() + RETRY_BACKOFF_MINUTES * 60_000 * Math.min(attempts + 1, 5)),
      },
    });
  } catch (err) {
    console.error("[calendar-sync] enqueueSyncJob failed:", err instanceof Error ? err.message : err);
  }
}

/** Process all due sync jobs for a user. Never throws. */
export async function processSyncQueue(
  accessToken: string,
  userId: string,
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const dueJobs = await prisma.calendarSyncJob.findMany({
    where: { userId, status: "pending", nextAttemptAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  let succeeded = 0;
  let failed = 0;

  for (const job of dueJobs) {
    const event = await prisma.calendarEvent.findUnique({ where: { id: job.eventId } });
    if (!event) {
      await prisma.calendarSyncJob.update({ where: { id: job.id }, data: { status: "failed", lastError: "Event not found" } });
      failed++;
      continue;
    }

    await prisma.calendarSyncJob.update({
      where: { id: job.id },
      data: { status: "processing", attempts: { increment: 1 }, lastRunAt: new Date() },
    });

    let ok = false;
    let error: string | undefined;

    if (job.action === "delete") {
      const res = await deleteEventFromGraph(accessToken, event);
      ok = res.ok;
      error = res.error;
    } else {
      const res = await pushEventToGraph(accessToken, event);
      ok = res.ok;
      error = res.error;
      if (ok && res.graphEventId) {
        event.graphEventId = res.graphEventId;
        event.changeKey = res.changeKey ?? event.changeKey ?? null;
      }
    }

    const attempts = job.attempts + 1;
    const giveUp = !ok && attempts >= (job.maxAttempts || MAX_RETRY_ATTEMPTS);

    if (ok) {
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: {
          graphSyncStatus: job.action === "delete" ? SYNC_STATUS.DELETED : SYNC_STATUS.SYNCED,
          syncError: null,
          syncAttempts: 0,
          lastSyncedAt: new Date(),
          graphEventId: job.action === "delete" ? null : event.graphEventId,
          changeKey: event.changeKey,
        },
      });
      await prisma.calendarSyncJob.update({ where: { id: job.id }, data: { status: "succeeded" } });
      succeeded++;
    } else if (giveUp) {
      await prisma.calendarSyncJob.update({
        where: { id: job.id },
        data: { status: "failed", lastError: error ?? "Failed" },
      });
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: {
          graphSyncStatus: SYNC_STATUS.ERROR,
          syncError: error ?? "Sync failed",
          syncAttempts: attempts,
        },
      });
      failed++;
    } else {
      await prisma.calendarSyncJob.update({
        where: { id: job.id },
        data: {
          status: "pending",
          lastError: error ?? "Failed",
          nextAttemptAt: new Date(Date.now() + RETRY_BACKOFF_MINUTES * 60_000 * Math.min(attempts + 1, 5)),
        },
      });
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { graphSyncStatus: SYNC_STATUS.ERROR, syncError: error ?? "Sync pending retry", syncAttempts: attempts },
      });
      failed++;
    }
  }

  return { processed: dueJobs.length, succeeded, failed };
}

/* ------------------------------------------------------------------ */
/* 4. Orchestration                                                    */
/* ------------------------------------------------------------------ */

export interface SyncRunSummary {
  ok: boolean;
  pulled: { imported: number; updated: number; removed: number };
  queue: { processed: number; succeeded: number; failed: number };
  lastSyncAt: Date;
  error?: string;
}

/**
 * Full background sync for a user: pull upstream delta, then flush the retry
 * queue. Both steps are individually failure-tolerant — an upstream outage
 * records errors but never throws to the route.
 */
export async function runCalendarSync(
  accessToken: string,
  userId: string,
): Promise<SyncRunSummary> {
  const pull = await pullCalendarDelta(accessToken, userId);
  const queue = await processSyncQueue(accessToken, userId);

  return {
    ok: !pull.error && queue.failed === 0,
    pulled: { imported: pull.imported, updated: pull.updated, removed: pull.removed },
    queue,
    lastSyncAt: pull.lastSyncAt,
    error: pull.error,
  };
}

/**
 * Same as `runCalendarSync`, but resolves the user's Graph access token from
 * the at-rest token store — for background workers and webhooks that have no
 * browser session. Throws when the user has no stored Microsoft session.
 */
export async function runCalendarSyncForUser(userId: string): Promise<SyncRunSummary> {
  const { getAccessTokenForUser } = await import("@/lib/server/graph-tokens");
  const accessToken = await getAccessTokenForUser(userId);
  return runCalendarSync(accessToken, userId);
}

/** Sync status snapshot for the UI (GET /api/calendar/sync). */
export async function getSyncStatus(userId: string) {
  const [deltaState, pendingJobs, errorEvents, lastEvent] = await Promise.all([
    prisma.calendarDeltaState.findUnique({ where: { userId } }),
    prisma.calendarSyncJob.count({ where: { userId, status: "pending" } }),
    prisma.calendarEvent.count({ where: { userId, graphSyncStatus: SYNC_STATUS.ERROR } }),
    prisma.calendarEvent.findFirst({ where: { userId }, orderBy: { lastSyncedAt: "desc" }, select: { lastSyncedAt: true } }),
  ]);

  return {
    connected: true,
    lastSyncAt: deltaState?.lastSyncAt ?? lastEvent?.lastSyncedAt ?? null,
    pendingJobs,
    errorEvents,
    retryable: pendingJobs > 0 || errorEvents > 0,
  };
}
