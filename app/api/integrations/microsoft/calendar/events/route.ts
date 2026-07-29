import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";
import { calendarCreateSchema } from "@/lib/validation/microsoft";

export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const startDateTime = searchParams.get("startDateTime");
  const endDateTime = searchParams.get("endDateTime");
  const top = searchParams.get("$top") || "100";
  const orderby = searchParams.get("$orderby") || "start/dateTime ASC";
  const filter = searchParams.get("$filter") || "";

  if (startDateTime && endDateTime) {
    const graphPath = `/me/calendarview?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&$orderby=${encodeURIComponent(orderby)}&$top=${encodeURIComponent(top)}`;
    const result = await graphFetchWithTimeout(accessToken, graphPath) as { value: unknown[] };
    return Response.json(result);
  }

  let graphPath = `/me/events?$top=${encodeURIComponent(top)}&$orderby=${encodeURIComponent(orderby)}`;
  if (filter) {
    graphPath += `&$filter=${encodeURIComponent(filter)}`;
  }

  const result = await graphFetchWithTimeout(accessToken, graphPath) as { value: unknown[] };
  return Response.json(result);
});

export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const raw = await req.json();
  const parsed = calendarCreateSchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      { error: first?.message || "Invalid request body" },
      { status: 422 },
    );
  }

  const body: Record<string, unknown> = {
    subject: parsed.data.subject,
    start: parsed.data.start,
    end: parsed.data.end,
    showAs: parsed.data.showAs,
    isReminderOn: parsed.data.isReminderOn,
    reminderMinutesBeforeStart: parsed.data.reminderMinutesBeforeStart,
    categories: parsed.data.categories,
  };

  if (parsed.data.body) {
    body.body = parsed.data.body;
  }
  if (parsed.data.location) {
    body.location = { displayName: parsed.data.location };
  }
  if (parsed.data.attendees.length > 0) {
    body.attendees = parsed.data.attendees;
  }
  if (parsed.data.isOnlineMeeting) {
    body.isOnlineMeeting = true;
    body.onlineMeetingProvider = "teamsForBusiness";
  }

  const result = await graphFetchWithTimeout(accessToken, "/me/events", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return Response.json(result, { status: 201 });
}, { rateLimitAction: "calendar:create" });
