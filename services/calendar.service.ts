import { v4 as uuid } from "uuid";
import type { CalendarEvent } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";
import { graphApi, GraphClientError } from "./graph-client";

function toCalendarEvent(item: Record<string, unknown>): CalendarEvent {
  const onlineMeeting = item.onlineMeeting as { joinUrl?: string; conferenceId?: string } | undefined;
  const organizer = (item.organizer as { emailAddress?: { name?: string; address?: string } })?.emailAddress;
  const attendees = (item.attendees as { emailAddress?: { name?: string; address?: string }; status?: { response?: string } }[]) || [];
  return {
    id: (item.id as string) || uuid(),
    subject: (item.subject as string) || "",
    body: ((item.body as { content?: string })?.content) || "",
    start: (item.start as { dateTime?: string })?.dateTime || "",
    end: (item.end as { dateTime?: string })?.dateTime || "",
    isAllDay: (item.isAllDay as boolean) ?? false,
    location: ((item.location as { displayName?: string })?.displayName) || "",
    onlineMeeting: {
      provider: onlineMeeting?.joinUrl ? "teams" : "",
      url: onlineMeeting?.joinUrl || "",
    },
    attendees: attendees.map((a) => ({
      name: a.emailAddress?.name || "",
      email: a.emailAddress?.address || "",
      status: a.status?.response || "none",
    })),
    organizer: {
      name: organizer?.name || "",
      email: organizer?.address || "",
    },
    showAs: (item.showAs as CalendarEvent["showAs"]) || "busy",
    categories: (item.categories as string[]) || [],
    recurrence: (item.recurrence as string) || null,
    reminder: (item.isReminderOn as boolean) ? 15 : 0,
    createdAt: (item.createdDateTime as string) || new Date().toISOString(),
    updatedAt: (item.lastModifiedDateTime as string) || new Date().toISOString(),
  };
}

class CalendarService {
  private events: CalendarEvent[] = [];

  async getEvents(start: string, end: string): Promise<CalendarEvent[]> {
    try {
      const result = await graphApi(
        `/me/calendarview?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}&$orderby=start/dateTime ASC&$top=100`,
      ) as { value: Record<string, unknown>[] };
      return (result.value || []).map(toCalendarEvent);
    } catch (err) {
      if (err instanceof GraphClientError && err.status === 503) {
        return this.events.filter((e) => {
          return e.start >= start && e.end <= end;
        }).sort((a, b) => a.start.localeCompare(b.start));
      }
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to load events: ${err.message}`);
      }
      throw new Error("Failed to load events");
    }
  }

  async getEvent(id: string): Promise<CalendarEvent | null> {
    try {
      const result = await graphApi(`/me/events/${id}`) as Record<string, unknown>;
      return toCalendarEvent(result);
    } catch (err) {
      if (err instanceof GraphClientError && err.status === 503) {
        return this.events.find((e) => e.id === id) || null;
      }
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to load event: ${err.message}`);
      }
      throw new Error("Failed to load event");
    }
  }

  async create(data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">): Promise<CalendarEvent> {
    try {
      const isOnlineMeeting = !!(data.onlineMeeting?.url);

      const graphEvent: Record<string, unknown> = {
        subject: data.subject,
        body: { contentType: "text", content: data.body },
        start: { dateTime: data.start, timeZone: "UTC" },
        end: { dateTime: data.end, timeZone: "UTC" },
        location: { displayName: data.location },
        attendees: data.attendees.map((a) => ({
          emailAddress: { address: a.email, name: a.name },
          type: "required",
        })),
        showAs: data.showAs || "busy",
        categories: data.categories,
        isReminderOn: data.reminder > 0,
        reminderMinutesBeforeStart: data.reminder || 15,
      };

      if (isOnlineMeeting) {
        graphEvent.isOnlineMeeting = true;
        graphEvent.onlineMeetingProvider = "teamsForBusiness";
      }

      const result = await graphApi("/me/events", {
        method: "POST",
        body: JSON.stringify(graphEvent),
      }) as Record<string, unknown>;

      const event = toCalendarEvent(result);
      eventBus.emit(Events.CALENDAR_EVENT_CREATED, { ...event, entityId: event.id });
      return event;
    } catch (err) {
      if (err instanceof GraphClientError && err.status === 503) {
        const event: CalendarEvent = {
          ...data,
          id: uuid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.events.push(event);
        eventBus.emit(Events.CALENDAR_EVENT_CREATED, { ...event, entityId: event.id });
        return event;
      }
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to create event: ${err.message}`);
      }
      throw new Error("Failed to create event");
    }
  }

  async update(id: string, data: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>): Promise<CalendarEvent> {
    try {
      const isOnlineMeeting = !!(data.onlineMeeting?.url);

      const graphEvent: Record<string, unknown> = {};

      if (data.subject !== undefined) graphEvent.subject = data.subject;
      if (data.body !== undefined) graphEvent.body = { contentType: "text", content: data.body };
      if (data.start !== undefined) graphEvent.start = { dateTime: data.start, timeZone: "UTC" };
      if (data.end !== undefined) graphEvent.end = { dateTime: data.end, timeZone: "UTC" };
      if (data.location !== undefined) graphEvent.location = { displayName: data.location };
      if (data.showAs !== undefined) graphEvent.showAs = data.showAs;
      if (data.categories !== undefined) graphEvent.categories = data.categories;
      if (data.reminder !== undefined) {
        graphEvent.isReminderOn = data.reminder > 0;
        graphEvent.reminderMinutesBeforeStart = data.reminder || 15;
      }
      if (data.attendees !== undefined) {
        graphEvent.attendees = data.attendees.map((a) => ({
          emailAddress: { address: a.email, name: a.name },
          type: "required",
        }));
      }

      if (isOnlineMeeting) {
        graphEvent.isOnlineMeeting = true;
        graphEvent.onlineMeetingProvider = "teamsForBusiness";
      }

      const result = await graphApi(`/me/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(graphEvent),
      }) as Record<string, unknown>;

      const event = toCalendarEvent(result);
      eventBus.emit(Events.CALENDAR_EVENT_UPDATED, { ...event, entityId: event.id });
      return event;
    } catch (err) {
      if (err instanceof GraphClientError && err.status === 503) {
        const idx = this.events.findIndex((e) => e.id === id);
        if (idx === -1) throw new Error("Event not found");
        this.events[idx] = { ...this.events[idx], ...data, updatedAt: new Date().toISOString() };
        eventBus.emit(Events.CALENDAR_EVENT_UPDATED, { ...this.events[idx], entityId: this.events[idx].id });
        return this.events[idx];
      }
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to update event: ${err.message}`);
      }
      throw new Error("Failed to update event");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await graphApi(`/me/events/${id}`, { method: "DELETE" });
      eventBus.emit(Events.CALENDAR_EVENT_DELETED, { entityId: id });
    } catch (err) {
      if (err instanceof GraphClientError && err.status === 503) {
        const event = this.events.find((e) => e.id === id);
        this.events = this.events.filter((e) => e.id !== id);
        if (event) {
          eventBus.emit(Events.CALENDAR_EVENT_DELETED, { ...event, entityId: event.id });
        }
        return;
      }
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to delete event: ${err.message}`);
      }
      throw new Error("Failed to delete event");
    }
  }

  async findEventsForEntity(entityType: string, entityId: string): Promise<CalendarEvent[]> {
    try {
      const result = await graphApi(
        `/me/events?$top=50&$orderby=start/dateTime ASC&$filter=categories/any(c:c eq '${encodeURIComponent(entityType)}')`,
      ) as { value: Record<string, unknown>[] };
      return (result.value || []).map(toCalendarEvent);
    } catch (err) {
      if (err instanceof GraphClientError && err.status === 503) {
        return this.events.filter((e) =>
          e.categories.includes(entityType) || e.body.includes(entityId)
        ).sort((a, b) => a.start.localeCompare(b.start));
      }
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to find events: ${err.message}`);
      }
      throw new Error("Failed to find events");
    }
  }
}

export const calendarService = new CalendarService();
