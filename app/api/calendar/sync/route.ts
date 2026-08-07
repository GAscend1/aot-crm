import { NextRequest, NextResponse } from "next/server";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { runCalendarSync, getSyncStatus } from "@/services/calendar-sync.service";
import { getGraphToken, GraphServerError } from "@/services/graph-server";
export const dynamic = "force-dynamic";

/**
 * Calendar sync trigger.
 *  - POST: run a background sync for the signed-in user (delta pull + retry
 *    queue flush). Safe to call on calendar mount and from a cron job.
 *  - GET:  current sync state (last sync, pending jobs, error events).
 */
export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const status = await getSyncStatus(user.id);
    return NextResponse.json(status);
  } catch (err) {
    logServerError("GET /api/calendar/sync", err);
    return serverError("Failed to read sync status");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  // Early return when Graph is not configured — the local calendar keeps
  // working; sync simply reports disconnected.
  if (process.env.USE_MICROSOFT_GRAPH !== "true") {
    return NextResponse.json({
      ok: false,
      error: "Microsoft Graph is not enabled. Local events work; Outlook sync is off.",
      pulled: { imported: 0, updated: 0, removed: 0 },
      queue: { processed: 0, succeeded: 0, failed: 0 },
      lastSyncAt: null,
    });
  }

  try {
    const accessToken = await getGraphToken(request);
    const summary = await runCalendarSync(accessToken, user.id);
    return NextResponse.json(summary);
  } catch (err) {
    if (err instanceof GraphServerError) {
      // Token expired / missing — surface reconnect state, never crash.
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          code: err.code ?? "sync_failed",
          pulled: { imported: 0, updated: 0, removed: 0 },
          queue: { processed: 0, succeeded: 0, failed: 0 },
          lastSyncAt: null,
        },
        { status: 200 },
      );
    }
    logServerError("POST /api/calendar/sync", err);
    return serverError("Failed to run calendar sync");
  }
}
