import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/api";
import { runCalendarSyncForUser } from "@/services/calendar-sync.service";
export const dynamic = "force-dynamic";

/**
 * Microsoft Graph change-notification webhook for calendar events.
 *
 * - GET:  `validationToken` handshake that Microsoft performs when the
 *   subscription is created.
 * - POST: receives change notifications and kicks off a delta sync for the
 *   affected user (fire-and-forget; the response must be fast).
 *
 * Graph posts here without a browser session, so this route deliberately does
 * NOT use `withGraphAuth`. Security relies on the subscription `clientState`
 * (a server secret) included in every notification.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("validationToken");
  if (token) {
    // Microsoft requires the token echoed back verbatim as text/plain.
    return new NextResponse(token, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.json({ error: "Missing validationToken" }, { status: 400 });
}

const CLIENT_STATE = process.env.MICROSOFT_GRAPH_WEBHOOK_CLIENT_STATE ?? "aot-crm-calendar";

interface GraphNotification {
  subscriptionId?: string;
  clientState?: string;
  resource?: string;
  changeType?: string;
  lifecycleEvent?: string;
  tenantId?: string;
}

export async function POST(request: NextRequest) {
  // Verify the shared clientState secret so random POSTs can't trigger syncs.
  const raw = await request.text();
  let parsed: { value?: GraphNotification[] };
  try {
    parsed = JSON.parse(raw) as { value?: GraphNotification[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const notifications = parsed.value ?? [];
  if (notifications.length === 0) return NextResponse.json({ success: true });

  // Strict gate: every notification must carry our secret verbatim. Graph
  // includes clientState on every notification when configured on the
  // subscription, so anything without it is not ours.
  if (notifications.some((n) => n.clientState !== CLIENT_STATE)) {
    return NextResponse.json({ error: "Invalid clientState" }, { status: 403 });
  }

  // Lifecycle notifications (reauthorizationRequired, subscriptionRemoved,
  // missed) carry no event data — ack and let the next user-initiated sync
  // or refresh recreate/renew the subscription.
  if (notifications.some((n) => n.lifecycleEvent)) {
    return NextResponse.json({ success: true });
  }

  // Fire-and-forget: map each notification's subscriptionId to its owning
  // CRM user and pull their delta. Fall back to users with an active delta
  // cursor when the subscription row is missing (bounded, best-effort).
  void (async () => {
    try {
      const subscriptionIds = [
        ...new Set(notifications.map((n) => n.subscriptionId).filter((s): s is string => !!s)),
      ];
      const owners =
        subscriptionIds.length > 0
          ? await prisma.webhookSubscription.findMany({
              where: { graphSubscriptionId: { in: subscriptionIds } },
              select: { userId: true },
            })
          : [];
      const userIds =
        owners.length > 0
          ? owners.map((o) => o.userId)
          : (await prisma.calendarDeltaState.findMany({ select: { userId: true }, take: 5 })).map(
              (d) => d.userId,
            );

      for (const userId of userIds) {
        try {
          await runCalendarSyncForUser(userId);
        } catch {
          // No stored token / refresh failed — skip; the user's next login
          // or manual sync retries.
        }
      }
    } catch (err) {
      logServerError("webhook sync runner", err);
    }
  })();

  return NextResponse.json({ success: true });
}
