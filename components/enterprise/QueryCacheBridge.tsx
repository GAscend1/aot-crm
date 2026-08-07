"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { eventBus } from "@/services/event-bus";
import { Events } from "@/services/events";

// Only mutation/status events invalidate caches — high-frequency ambient events
// (notifications, reminders, user login) are excluded so a busy dashboard is
// not refetched on every notification tick.
const INVALIDATION_EVENTS = [
  Events.CUSTOMER_CREATED, Events.CUSTOMER_UPDATED, Events.CUSTOMER_DELETED,
  Events.COMPANY_CREATED, Events.COMPANY_UPDATED, Events.COMPANY_DELETED,
  Events.CONTACT_CREATED, Events.CONTACT_UPDATED, Events.CONTACT_DELETED,
  Events.LEAD_CREATED, Events.LEAD_UPDATED, Events.LEAD_DELETED,
  Events.OPPORTUNITY_CREATED, Events.OPPORTUNITY_UPDATED, Events.OPPORTUNITY_DELETED,
  Events.OPPORTUNITY_WON, Events.OPPORTUNITY_LOST,
  Events.ACTIVITY_CREATED, Events.ACTIVITY_UPDATED, Events.ACTIVITY_DELETED, Events.ACTIVITY_COMPLETED,
  Events.TICKET_CREATED, Events.TICKET_UPDATED, Events.TICKET_DELETED,
  Events.DOCUMENT_CREATED, Events.DOCUMENT_UPDATED, Events.DOCUMENT_DELETED,
  Events.NOTE_ADDED,
  Events.ATTACHMENT_UPLOADED,
  Events.EMAIL_SENT,
  Events.TEAMS_MEETING_CREATED, Events.TEAMS_MEETING_UPDATED,
  Events.ZOOM_MEETING_CREATED, Events.ZOOM_MEETING_UPDATED,
  Events.CALENDAR_EVENT_CREATED, Events.CALENDAR_EVENT_UPDATED, Events.CALENDAR_EVENT_DELETED,
  Events.TASK_CREATED, Events.TASK_UPDATED, Events.TASK_COMPLETED,
  Events.CALL_CREATED, Events.CALL_COMPLETED,
];

/**
 * Keeps the TanStack Query caches fresh without manual invalidation at every
 * call site: any entity mutation event invalidates the shared list/dashboard/
 * reports queries so the next consumer refetches once.
 */
export function QueryCacheBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribes = INVALIDATION_EVENTS.map((event) =>
      eventBus.on(event, () => {
        queryClient.invalidateQueries({ queryKey: ["api-list"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
      }),
    );
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [queryClient]);

  return null;
}
