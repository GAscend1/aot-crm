import { v4 as uuid } from "uuid";
import type { CalendarEvent } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";

class CalendarService {
  private events: CalendarEvent[] = [];

  async getEvents(start: string, end: string): Promise<CalendarEvent[]> {
    return this.events.filter((e) => {
      return e.start >= start && e.end <= end;
    }).sort((a, b) => a.start.localeCompare(b.start));
  }

  async getEvent(id: string): Promise<CalendarEvent | null> {
    return this.events.find((e) => e.id === id) || null;
  }

  async create(data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">): Promise<CalendarEvent> {
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

  async update(id: string, data: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>): Promise<CalendarEvent> {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Event not found");
    this.events[idx] = { ...this.events[idx], ...data, updatedAt: new Date().toISOString() };
    eventBus.emit(Events.CALENDAR_EVENT_UPDATED, { ...this.events[idx], entityId: this.events[idx].id });
    return this.events[idx];
  }

  async delete(id: string): Promise<void> {
    const event = this.events.find((e) => e.id === id);
    this.events = this.events.filter((e) => e.id !== id);
    if (event) {
      eventBus.emit(Events.CALENDAR_EVENT_DELETED, { ...event, entityId: event.id });
    }
  }

  async findEventsForEntity(entityType: string, entityId: string): Promise<CalendarEvent[]> {
    return this.events.filter((e) =>
      e.categories.includes(entityType) || e.body.includes(entityId)
    ).sort((a, b) => a.start.localeCompare(b.start));
  }
}

export const calendarService = new CalendarService();
