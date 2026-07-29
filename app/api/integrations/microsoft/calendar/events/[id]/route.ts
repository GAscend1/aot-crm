import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../../with-graph-auth";
import { calendarUpdateSchema, eventIdSchema } from "@/lib/validation/microsoft";

export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/calendar/events/")[1];
  const idCheck = eventIdSchema.safeParse(id);
  if (!idCheck.success) {
    return Response.json({ error: "Invalid event ID format" }, { status: 422 });
  }

  const result = await graphFetchWithTimeout(accessToken, `/me/events/${id}`);
  return Response.json(result);
});

export const PATCH = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/calendar/events/")[1];
  const idCheck = eventIdSchema.safeParse(id);
  if (!idCheck.success) {
    return Response.json({ error: "Invalid event ID format" }, { status: 422 });
  }

  const raw = await req.json();
  const parsed = calendarUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      { error: first?.message || "Invalid request body" },
      { status: 422 },
    );
  }

  const body: Record<string, unknown> = {};

  if (parsed.data.subject !== undefined) body.subject = parsed.data.subject;
  if (parsed.data.body !== undefined) body.body = parsed.data.body;
  if (parsed.data.start !== undefined) body.start = parsed.data.start;
  if (parsed.data.end !== undefined) body.end = parsed.data.end;
  if (parsed.data.location !== undefined) body.location = { displayName: parsed.data.location };
  if (parsed.data.showAs !== undefined) body.showAs = parsed.data.showAs;
  if (parsed.data.categories !== undefined) body.categories = parsed.data.categories;
  if (parsed.data.isReminderOn !== undefined) body.isReminderOn = parsed.data.isReminderOn;
  if (parsed.data.reminderMinutesBeforeStart !== undefined) body.reminderMinutesBeforeStart = parsed.data.reminderMinutesBeforeStart;
  if (parsed.data.attendees !== undefined && parsed.data.attendees.length > 0) {
    body.attendees = parsed.data.attendees;
  }
  if (parsed.data.isOnlineMeeting) {
    body.isOnlineMeeting = true;
    body.onlineMeetingProvider = "teamsForBusiness";
  }

  const result = await graphFetchWithTimeout(accessToken, `/me/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  return Response.json(result);
}, { rateLimitAction: "calendar:update" });

export const DELETE = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/calendar/events/")[1];
  const idCheck = eventIdSchema.safeParse(id);
  if (!idCheck.success) {
    return Response.json({ error: "Invalid event ID format" }, { status: 422 });
  }

  await graphFetchWithTimeout(accessToken, `/me/events/${id}`, {
    method: "DELETE",
  });

  return Response.json({ success: true });
}, { rateLimitAction: "calendar:delete" });
