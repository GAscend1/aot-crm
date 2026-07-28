import { v4 as uuid } from "uuid";
import { eventBus } from "./event-bus";
import { Events, type EntityEventPayload } from "./events";
import type { Notification } from "@/types/common";

class SynchronizedNotificationService {
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    this.initHandlers();
  }

  private initHandlers(): void {
    const handlers: [string, (payload: unknown) => Record<string, unknown> | null][] = [
      [Events.CALENDAR_EVENT_CREATED, (_p) => ({ type: "info", title: "Event created", message: "A new calendar event has been scheduled", category: "calendar" })],
      [Events.CALENDAR_EVENT_UPDATED, (_p) => ({ type: "info", title: "Event updated", message: "A calendar event has been modified", category: "calendar" })],
      [Events.CALENDAR_EVENT_DELETED, (_p) => ({ type: "warning", title: "Event cancelled", message: "A calendar event has been cancelled", category: "calendar" })],
      [Events.TEAMS_MEETING_CREATED, (_p) => ({ type: "info", title: "Teams meeting created", message: "A new Teams meeting has been scheduled", category: "meetings" })],
      [Events.TEAMS_MEETING_UPDATED, (_p) => ({ type: "info", title: "Teams meeting updated", message: "A Teams meeting has been modified", category: "meetings" })],
      [Events.ZOOM_MEETING_CREATED, (_p) => ({ type: "info", title: "Zoom meeting created", message: "A new Zoom meeting has been scheduled", category: "meetings" })],
      [Events.ZOOM_MEETING_UPDATED, (_p) => ({ type: "info", title: "Zoom meeting updated", message: "A Zoom meeting has been modified", category: "meetings" })],
      [Events.EMAIL_SENT, (_p) => ({ type: "success", title: "Email sent", message: "Your email has been sent successfully", category: "email" })],
      [Events.EMAIL_FAILED, (_p) => ({ type: "error", title: "Email failed", message: "Failed to send email", category: "email" })],
      [Events.OPPORTUNITY_WON, (p) => ({ type: "success", title: "Opportunity won", message: `Opportunity ${(p as unknown as EntityEventPayload).data?.title || ""} has been won`, category: "crm" })],
      [Events.OPPORTUNITY_LOST, (p) => ({ type: "error", title: "Opportunity lost", message: `Opportunity ${(p as unknown as EntityEventPayload).data?.title || ""} has been lost`, category: "crm" })],
      [Events.CUSTOMER_CREATED, (_p) => ({ type: "success", title: "New customer", message: "A new customer has been added", category: "crm" })],
      [Events.CONTACT_CREATED, (_p) => ({ type: "info", title: "New contact", message: "A new contact has been created", category: "crm" })],
      [Events.TASK_ASSIGNED, (_p) => ({ type: "info", title: "Task assigned", message: "A new task has been assigned to you", category: "tasks" })],
      [Events.TASK_COMPLETED, (_p) => ({ type: "success", title: "Task completed", message: "A task has been completed", category: "tasks" })],
    ];

    for (const [event, builder] of handlers) {
      eventBus.on(event, (payload) => {
        const notif = builder(payload);
        if (notif) {
          this.create(notif, payload as Record<string, unknown>);
        }
      });
    }
  }

  private create(base: Record<string, unknown>, payload: Record<string, unknown>): void {
    const notification: Notification = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      read: false,
      type: (base.type as Notification["type"]) || "info",
      title: (base.title as string) || "",
      message: (base.message as string) || "",
      category: base.category as string,
      entityType: (payload as unknown as EntityEventPayload).entityType,
      entityId: (payload as unknown as EntityEventPayload).entityId,
    };

    this.save(notification);
    eventBus.emit(Events.NOTIFICATION_CREATED, notification);
    this.notifyListeners();
  }

  private save(notification: Notification): void {
    try {
      const stored = JSON.parse(localStorage.getItem("crm-notifications") || "[]");
      stored.unshift(notification);
      localStorage.setItem("crm-notifications", JSON.stringify(stored.slice(0, 200)));
    } catch {}
  }

  getAll(): Notification[] {
    try {
      return JSON.parse(localStorage.getItem("crm-notifications") || "[]");
    } catch {
      return [];
    }
  }

  markAsRead(id: string): void {
    const all = this.getAll();
    const idx = all.findIndex((n) => n.id === id);
    if (idx !== -1) {
      all[idx].read = true;
      localStorage.setItem("crm-notifications", JSON.stringify(all));
      this.notifyListeners();
    }
  }

  markAllAsRead(): void {
    const all = this.getAll().map((n) => ({ ...n, read: true }));
    localStorage.setItem("crm-notifications", JSON.stringify(all));
    this.notifyListeners();
  }

  clear(): void {
    localStorage.setItem("crm-notifications", "[]");
    this.notifyListeners();
  }

  remove(id: string): void {
    const all = this.getAll().filter((n) => n.id !== id);
    localStorage.setItem("crm-notifications", JSON.stringify(all));
    this.notifyListeners();
  }

  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getAll());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notifyListeners(): void {
    const all = this.getAll();
    for (const listener of this.listeners) {
      try { listener(all); } catch {}
    }
  }
}

export const synchronizedNotificationService = new SynchronizedNotificationService();
