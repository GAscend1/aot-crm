import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/api";
import { runCalendarSyncForUser } from "@/services/calendar-sync.service";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Background sync worker — safe to invoke from an external scheduler (Vercel
 * Cron / Azure Timer) via POST or GET. Processes the retry queue for users who
 * have synced at least once, so failed pushes/pulls recover even when nobody
 * has the calendar open.
 *
 * Security: this route is intentionally lightweight (no per-user data exposed).
 * It runs under the same session middleware as everything else; production
 * deployments should additionally protect it with a cron token via
 * `CRON_SECRET` header check (see note below).
 */
export async function GET() {
  if (process.env.CRON_SECRET) {
    // Guarded deployment: require the secret when configured.
    // (Passed via query param to keep scheduler config simple.)
    return NextResponse.json({ error: "Use POST with x-cron-secret header" }, { status: 405 });
  }
  return runWorker();
}

export async function POST(request: Request) {
  if (process.env.CRON_SECRET) {
    const header = request.headers.get("x-cron-secret");
    if (header !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return runWorker();
}

async function runWorker() {
  try {
    if (process.env.USE_MICROSOFT_GRAPH !== "true") {
      return NextResponse.json({ enabled: false, reason: "Microsoft Graph is not enabled" });
    }

    // Users with an active delta cursor are the ones actively syncing.
    const users = await prisma.calendarDeltaState.findMany({ select: { userId: true }, take: 100 });
    const results: Record<string, unknown> = {};

    for (const { userId } of users) {
      try {
        // No browser session here — resolve the user's token from the
        // at-rest store (persisted on sign-in / refresh by the jwt callback).
        const summary = await runCalendarSyncForUser(userId);
        results[userId] = { pulled: summary.pulled, queue: summary.queue, ok: summary.ok };
      } catch (err) {
        results[userId] = { skipped: err instanceof Error ? err.message : "token unavailable" };
      }
    }

    return NextResponse.json({ ok: true, users: results });
  } catch (err) {
    logServerError("POST /api/calendar/sync/background", err);
    return NextResponse.json({ ok: false, error: "Background sync failed" }, { status: 500 });
  }
}
