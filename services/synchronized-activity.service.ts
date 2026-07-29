import { v4 as uuid } from "uuid";
import { eventBus } from "./event-bus";
import { Events, type EntityEventPayload } from "./events";

interface TimelineActivity {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  details?: string;
  userName: string;
  userId?: string;
  timestamp: string;
}

class SynchronizedActivityService {
  private activities: TimelineActivity[] = [];

  constructor() {
    this.initHandlers();
  }

  private initHandlers(): void {
    const handlers: [string, (p: unknown) => void][] = [
      [Events.CUSTOMER_CREATED, (p) => this.onEntityEvent(p as EntityEventPayload, "Customer created")],
      [Events.CUSTOMER_UPDATED, (p) => this.onEntityEvent(p as EntityEventPayload, "Customer updated")],
      [Events.CUSTOMER_DELETED, (p) => this.onEntityEvent(p as EntityEventPayload, "Customer deleted")],
      [Events.CONTACT_CREATED, (p) => this.onEntityEvent(p as EntityEventPayload, "Contact created")],
      [Events.CONTACT_UPDATED, (p) => this.onEntityEvent(p as EntityEventPayload, "Contact updated")],
      [Events.CONTACT_DELETED, (p) => this.onEntityEvent(p as EntityEventPayload, "Contact deleted")],
      [Events.OPPORTUNITY_CREATED, (p) => this.onEntityEvent(p as EntityEventPayload, "Opportunity created")],
      [Events.OPPORTUNITY_UPDATED, (p) => this.onEntityEvent(p as EntityEventPayload, "Opportunity updated")],
      [Events.OPPORTUNITY_WON, (p) => this.onEntityEvent(p as EntityEventPayload, "Opportunity won")],
      [Events.OPPORTUNITY_LOST, (p) => this.onEntityEvent(p as EntityEventPayload, "Opportunity lost")],
      [Events.EMAIL_SENT, (p) => this.onGenericEvent(p as { to: string; subject: string }, "Email sent", `To: ${(p as { to: string }).to} - ${(p as { subject: string }).subject}`)],
      [Events.EMAIL_FAILED, (p) => this.onGenericEvent(p as { to: string; subject: string }, "Email failed", `Failed to send to ${(p as { to: string }).to}`)],
      [Events.EMAIL_DRAFT_SAVED, (p) => this.onGenericEvent(p as { subject: string }, "Email draft saved", (p as { subject: string }).subject)],
      [Events.TEAMS_MEETING_CREATED, (p) => this.onGenericEvent(p as { subject: string }, "Teams meeting created", (p as { subject: string }).subject)],
      [Events.TEAMS_MEETING_UPDATED, (p) => this.onGenericEvent(p as { subject: string }, "Teams meeting updated", (p as { subject: string }).subject)],
      [Events.ZOOM_MEETING_CREATED, (p) => this.onGenericEvent(p as { topic: string }, "Zoom meeting created", (p as { topic: string }).topic)],
      [Events.ZOOM_MEETING_UPDATED, (p) => this.onGenericEvent(p as { topic: string }, "Zoom meeting updated", (p as { topic: string }).topic)],
      [Events.CALENDAR_EVENT_CREATED, (p) => this.onGenericEvent(p as { subject: string }, "Calendar event created", (p as { subject: string }).subject)],
      [Events.CALENDAR_EVENT_UPDATED, (p) => this.onGenericEvent(p as { subject: string }, "Calendar event updated", (p as { subject: string }).subject)],
      [Events.CALENDAR_EVENT_DELETED, (p) => this.onGenericEvent(p as { subject: string }, "Calendar event cancelled", (p as { subject: string }).subject)],
      [Events.NOTE_ADDED, (p) => this.onEntityEvent(p as EntityEventPayload, "Note added")],
      [Events.ATTACHMENT_UPLOADED, (p) => this.onGenericEvent(p as { name: string }, "Attachment uploaded", (p as { name: string }).name)],
      [Events.TASK_CREATED, (p) => this.onEntityEvent(p as EntityEventPayload, "Task created")],
      [Events.TASK_UPDATED, (p) => this.onEntityEvent(p as EntityEventPayload, "Task updated")],
      [Events.TASK_COMPLETED, (p) => this.onEntityEvent(p as EntityEventPayload, "Task completed")],
      [Events.CALL_CREATED, (p) => this.onGenericEvent(p as { title?: string }, "Call created", (p as { title?: string }).title)],
      [Events.CALL_COMPLETED, (p) => this.onGenericEvent(p as { title?: string }, "Call completed", (p as { title?: string }).title)],
    ];

    for (const [event, handler] of handlers) {
      eventBus.on(event, handler);
    }
  }

  private onEntityEvent(payload: EntityEventPayload, summary: string): void {
    const activity: TimelineActivity = {
      id: uuid(),
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      summary,
      details: payload.data ? JSON.stringify(payload.data) : undefined,
      userName: payload.userName || "System",
      userId: payload.userId,
      timestamp: new Date().toISOString(),
    };
    this.activities.unshift(activity);
    this.persist(activity);
    eventBus.emit(Events.ACTIVITY_CREATED, activity);
  }

  private onGenericEvent(payload: Record<string, unknown>, summary: string, details?: string): void {
    const activity: TimelineActivity = {
      id: uuid(),
      entityType: (payload.entityType as string) || "system",
      entityId: (payload.entityId as string) || uuid(),
      action: "created",
      summary,
      details,
      userName: (payload.userName as string) || "System",
      userId: payload.userId as string,
      timestamp: new Date().toISOString(),
    };
    this.activities.unshift(activity);
    this.persist(activity);
    eventBus.emit(Events.ACTIVITY_CREATED, activity);
  }

  getByEntity(entityType: string, entityId: string): TimelineActivity[] {
    return this.activities.filter(
      (a) => a.entityType === entityType && a.entityId === entityId
    );
  }

  getAll(): TimelineActivity[] {
    return [...this.activities];
  }

  getRecent(limit = 20): TimelineActivity[] {
    return this.activities.slice(0, limit);
  }

  private persist(activity: TimelineActivity): void {
    try {
      const stored = JSON.parse(localStorage.getItem("crm-timeline") || "[]");
      stored.unshift(activity);
      localStorage.setItem("crm-timeline", JSON.stringify(stored.slice(0, 500)));
    } catch {}
  }
}

export const synchronizedActivityService = new SynchronizedActivityService();
