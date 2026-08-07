import type { CalendarEvent } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";

export interface CalendarEventInput {
  subject: string;
  body?: string;
  start: string;
  end: string;
  isAllDay?: boolean;
  location?: string;
  timeZone?: string;
  attendees?: { name: string; email: string; status: string }[];
  onlineMeeting?: { provider: string; url: string };
  reminder?: number;
  entityType?: "lead" | "opportunity" | "customer" | "contact" | "company";
  entityId?: string;
}

export interface CalendarSyncStatus {
  lastSyncAt: string | null;
  pendingJobs: number;
  errorEvents: number;
  retryable: boolean;
}

export interface SyncRunResult {
  ok: boolean;
  error?: string;
  pulled?: { imported: number; updated: number; removed: number };
  queue?: { processed: number; succeeded: number; failed: number };
}

/**
 * Local-first calendar service (Phase 5). All events are persisted in the CRM
 * (`CalendarEvent` table) and mirrored to Microsoft 365 by the sync engine.
 * Graph outages never lose data or block the calendar UI — events sync with
 * `NOT_SYNCED`/`ERROR` status and are retried by the background queue.
 */
class CalendarService {
  /** Map the local API event shape (graphSyncStatus etc.) into the UI CalendarEvent. */
  private toUi(raw: Record<string, unknown>): CalendarEvent {
    const online = (raw.onlineMeeting as { provider?: string; url?: string }) ?? {};
    const attendees = (raw.attendees as { name: string; email: string; status: string }[]) ?? [];
    const organizer = (raw.organizer as { name: string; email: string }) ?? { name: "", email: "" };
    return {
      id: String(raw.id),
      subject: String(raw.subject ?? ""),
      body: String(raw.body ?? ""),
      start: String(raw.start ?? ""),
      end: String(raw.end ?? ""),
      isAllDay: Boolean(raw.isAllDay),
      location: String(raw.location ?? ""),
      onlineMeeting: {
        provider: online.provider ?? "",
        url: online.url ?? "",
      },
      attendees: attendees.map((a) => ({
        name: a.name ?? "",
        email: a.email ?? "",
        status: a.status ?? "none",
      })),
      organizer: {
        name: organizer.name ?? "",
        email: organizer.email ?? "",
      },
      showAs: (raw.showAs as CalendarEvent["showAs"]) ?? "busy",
      categories: (raw.categories as string[]) ?? [],
      recurrence: (raw.recurrence as string | null) ?? null,
      reminder: Number(raw.reminder ?? 0),
      createdAt: String(raw.createdAt ?? new Date().toISOString()),
      updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
    };
  }

  /** Load the user's local events for a time range. */
  async getEvents(start: string, end: string): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({ start, end });
    const res = await fetch(`/api/calendar/events?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load events");
    const body = (await res.json()) as { data: Record<string, unknown>[] };
    return (body.data ?? []).map((e) => this.toUi(e));
  }

  async getEvent(id: string): Promise<CalendarEvent | null> {
    const res = await fetch(`/api/calendar/events/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return this.toUi((await res.json()) as Record<string, unknown>);
  }

  async create(data: CalendarEventInput): Promise<CalendarEvent> {
    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(String(body.error ?? "Failed to create event"));
    const event = this.toUi(body);
    eventBus.emit(Events.CALENDAR_EVENT_CREATED, { ...event, entityId: event.id });
    return event;
  }

  async update(id: string, data: Partial<CalendarEventInput>): Promise<CalendarEvent> {
    const res = await fetch(`/api/calendar/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(String(body.error ?? "Failed to update event"));
    const event = this.toUi(body);
    eventBus.emit(Events.CALENDAR_EVENT_UPDATED, { ...event, entityId: event.id });
    return event;
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/calendar/events/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete event");
    eventBus.emit(Events.CALENDAR_EVENT_DELETED, { entityId: id });
  }

  /** Trigger a background sync (delta pull + retry queue flush). */
  async syncNow(): Promise<SyncRunResult> {
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return {
        ok: Boolean(body.ok),
        error: body.error ? String(body.error) : undefined,
        pulled: body.pulled as SyncRunResult["pulled"],
        queue: body.queue as SyncRunResult["queue"],
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Sync failed" };
    }
  }

  async getSyncStatus(): Promise<CalendarSyncStatus> {
    try {
      const res = await fetch("/api/calendar/sync", { cache: "no-store" });
      const body = (await res.json()) as CalendarSyncStatus;
      return {
        lastSyncAt: body.lastSyncAt ?? null,
        pendingJobs: body.pendingJobs ?? 0,
        errorEvents: body.errorEvents ?? 0,
        retryable: Boolean(body.retryable),
      };
    } catch {
      return { lastSyncAt: null, pendingJobs: 0, errorEvents: 0, retryable: false };
    }
  }
}

export const calendarService = new CalendarService();
