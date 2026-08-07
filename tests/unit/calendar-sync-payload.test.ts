import { describe, it, expect } from "vitest";

import { buildGraphPayload } from "@/services/calendar-sync.service";
import type { Prisma } from "@/generated/prisma/client";

type Row = Prisma.CalendarEventGetPayload<Record<string, never>>;

function makeRow(overrides: Partial<Row> = {}): Row {
  const base = {
    id: "evt-1",
    title: "Project kickoff",
    description: "Agenda TBD",
    startTime: new Date("2026-08-10T09:00:00.000Z"),
    endTime: new Date("2026-08-10T10:00:00.000Z"),
    allDay: false,
    location: "Conference Room A",
    graphSyncStatus: "NOT_SYNCED",
    reminderMinutes: 15,
    graphEventId: null,
    changeKey: null,
    timeZone: "Europe/Berlin",
    attendees: null,
    organizer: null,
    onlineMeetingUrl: null,
    lastSyncedAt: null,
    syncError: null,
    syncAttempts: 0,
    leadId: null,
    opportunityId: null,
    customerId: null,
    userId: "user-1",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    syncJobs: [],
  } as unknown as Row;
  return { ...base, ...overrides } as Row;
}

describe("buildGraphPayload (CRM → Outlook)", () => {
  it("preserves the local timezone on start and end", () => {
    const payload = buildGraphPayload(makeRow({ timeZone: "Europe/Berlin" }));
    expect(payload.start?.timeZone).toBe("Europe/Berlin");
    expect(payload.end?.timeZone).toBe("Europe/Berlin");
    expect(payload.start?.dateTime).toBe("2026-08-10T09:00:00.000Z");
  });

  it("defaults to UTC when no timezone is stored", () => {
    const payload = buildGraphPayload(makeRow({ timeZone: "UTC" }));
    expect(payload.start?.timeZone).toBe("UTC");
  });

  it("maps serialized attendees back to the Graph attendee shape", () => {
    const payload = buildGraphPayload(
      makeRow({
        attendees: [
          {
            emailAddress: { name: "Jane Doe", address: "jane@acme.test" },
            type: "required",
          },
        ],
      })
    );
    expect(payload.attendees).toHaveLength(1);
    expect(payload.attendees?.[0].emailAddress.address).toBe("jane@acme.test");
    expect(payload.attendees?.[0].type).toBe("required");
  });

  it("sets the online-meeting provider when a join URL is stored", () => {
    const payload = buildGraphPayload(
      makeRow({ onlineMeetingUrl: "https://teams.microsoft.com/l/meetup-join/abc" })
    );
    expect(payload.isOnlineMeeting).toBe(true);
    expect(payload.onlineMeetingProvider).toBe("teamsForBusiness");
  });

  it("omits the online-meeting flag when no join URL exists", () => {
    const payload = buildGraphPayload(makeRow());
    expect(payload.isOnlineMeeting).toBeUndefined();
  });

  it("maps reminder minutes to Graph reminder fields", () => {
    const payload = buildGraphPayload(makeRow({ reminderMinutes: 30 }));
    expect(payload.isReminderOn).toBe(true);
    expect(payload.reminderMinutesBeforeStart).toBe(30);
  });

  it("turns reminders off when reminderMinutes is 0", () => {
    const payload = buildGraphPayload(makeRow({ reminderMinutes: 0 }));
    expect(payload.isReminderOn).toBe(false);
  });

  it("drops the body when the event has no description", () => {
    const payload = buildGraphPayload(makeRow({ description: null }));
    expect(payload.body).toBeUndefined();
  });
});
