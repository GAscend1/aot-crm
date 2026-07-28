import { eventBus } from "./event-bus";
import { Events, type EntityEventPayload } from "./events";
import { auditService } from "./audit.service";

function initEventWiring(): void {
  const trackedEvents: [string, string][] = [
    [Events.CUSTOMER_CREATED, "created"],
    [Events.CUSTOMER_UPDATED, "updated"],
    [Events.CUSTOMER_DELETED, "deleted"],
    [Events.CONTACT_CREATED, "created"],
    [Events.CONTACT_UPDATED, "updated"],
    [Events.CONTACT_DELETED, "deleted"],
    [Events.COMPANY_CREATED, "created"],
    [Events.COMPANY_UPDATED, "updated"],
    [Events.COMPANY_DELETED, "deleted"],
    [Events.LEAD_CREATED, "created"],
    [Events.LEAD_UPDATED, "updated"],
    [Events.LEAD_DELETED, "deleted"],
    [Events.OPPORTUNITY_CREATED, "created"],
    [Events.OPPORTUNITY_UPDATED, "updated"],
    [Events.OPPORTUNITY_DELETED, "deleted"],
    [Events.ACTIVITY_CREATED, "created"],
    [Events.ACTIVITY_UPDATED, "updated"],
    [Events.ACTIVITY_DELETED, "deleted"],
    [Events.TICKET_CREATED, "created"],
    [Events.TICKET_UPDATED, "updated"],
    [Events.TICKET_DELETED, "deleted"],
    [Events.DOCUMENT_CREATED, "created"],
    [Events.DOCUMENT_UPDATED, "updated"],
    [Events.DOCUMENT_DELETED, "deleted"],
    [Events.EMAIL_SENT, "sent"],
    [Events.CALENDAR_EVENT_CREATED, "created"],
    [Events.CALENDAR_EVENT_UPDATED, "updated"],
    [Events.CALENDAR_EVENT_DELETED, "deleted"],
  ];

  for (const [eventKey, action] of trackedEvents) {
    eventBus.on(eventKey, (payload) => {
      const p = payload as EntityEventPayload;
      auditService.log({
        entityType: p.entityType || "system",
        entityId: p.entityId || "unknown",
        action: action as EntityEventPayload["action"],
        oldValue: p.oldData ? JSON.stringify(p.oldData) : undefined,
        newValue: p.data ? JSON.stringify(p.data) : undefined,
        userId: p.userId || "system",
        userName: p.userName || "System",
      });
    });
  }

  eventBus.on(Events.USER_LOGIN, (payload) => {
    const p = payload as { userId?: string; userName?: string };
    auditService.log({
      entityType: "user",
      entityId: p.userId || "unknown",
      action: "created",
      userId: p.userId || "system",
      userName: p.userName || "System",
    });
  });

  eventBus.on(Events.USER_LOGOUT, (payload) => {
    const p = payload as { userId?: string; userName?: string };
    auditService.log({
      entityType: "user",
      entityId: p.userId || "unknown",
      action: "archived",
      userId: p.userId || "system",
      userName: p.userName || "System",
    });
  });
}

let initialized = false;

export function ensureEventWiring(): void {
  if (initialized) return;
  initialized = true;
  initEventWiring();
}
