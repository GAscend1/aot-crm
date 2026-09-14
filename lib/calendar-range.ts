/**
 * Calendar date-range policy (pure, server+client safe).
 *
 * Microsoft Graph's `/me/calendarview` endpoint rejects ranges longer than
 * 1825 days ("The range between the start and end dates is greater than the
 * allowed range. Maximum number of days: 1825"). Every Graph calendar request
 * must therefore be built from a purpose-bounded window — never from unbounded
 * sentinels such as 2000-01-01 → 2100-01-01 (which is 20× the limit and was
 * the original full-pull bug).
 */

/** Microsoft Graph hard limit for /me/calendarview. */
export const CALENDAR_GRAPH_MAX_RANGE_DAYS = 1825;

/** CRM sync window: how far back / how far forward a full pull requests. */
export const SYNC_PAST_DAYS = 90;
export const SYNC_FUTURE_DAYS = 365;

/** Number of days in the leading/trailing buffer around the visible view. */
export const CALENDAR_VIEW_BUFFER_DAYS = 7;

export interface CalendarRange {
  start: Date;
  end: Date;
}

/**
 * The CRM synchronization window (full pull / resync): the past 90 days
 * through the next 365 days — 455 days, comfortably under the 1825-day cap.
 */
export function calendarSyncWindow(now: Date = new Date()): CalendarRange {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - SYNC_PAST_DAYS);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + SYNC_FUTURE_DAYS);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

/** Whole days between two ISO dates (floor). Negative when end < start. */
export function calendarRangeDays(startISO: string, endISO: string): number {
  const start = Date.parse(startISO);
  const end = Date.parse(endISO);
  if (Number.isNaN(start) || Number.isNaN(end)) return Number.NaN;
  return Math.floor((end - start) / 86_400_000);
}

export type CalendarRangeValidation =
  | { ok: true; start: Date; end: Date; days: number }
  | {
      ok: false;
      code: "invalid_dates" | "end_before_start" | "range_too_large";
      error: string;
    };

/**
 * Validate a (start, end) pair before it is sent to Microsoft Graph.
 *
 * - Both dates must parse.
 * - start must be strictly before end.
 * - the duration must be at least 1 day and at most
 *   CALENDAR_GRAPH_MAX_RANGE_DAYS (1825).
 *
 * Rejects — never silently clamps — so a frontend bug or malicious input can
 * not turn into a giant Graph request.
 */
export function validateCalendarRange(
  startISO: string | null | undefined,
  endISO: string | null | undefined,
): CalendarRangeValidation {
  if (!startISO || !endISO || !Date.parse(startISO) || !Date.parse(endISO)) {
    return { ok: false, code: "invalid_dates", error: "startDateTime and endDateTime must be valid dates." };
  }
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (end.getTime() <= start.getTime()) {
    return { ok: false, code: "end_before_start", error: "endDateTime must be after startDateTime." };
  }
  const days = calendarRangeDays(startISO, endISO);
  if (days < 1) {
    return { ok: false, code: "end_before_start", error: "The calendar range must be at least one day." };
  }
  if (days > CALENDAR_GRAPH_MAX_RANGE_DAYS) {
    return {
      ok: false,
      code: "range_too_large",
      error: `The requested calendar range (${days} days) exceeds Microsoft's maximum of ${CALENDAR_GRAPH_MAX_RANGE_DAYS} days.`,
    };
  }
  return { ok: true, start, end, days };
}

export type CalendarViewKind = "month" | "week" | "day";

/**
 * Visible-view fetch window (ISO strings) for the local calendar feed:
 * the visible span plus a small leading/trailing buffer so day cells always
 * have data for events that straddle a boundary. Never requests more than a
 * month of data at once.
 */
export function calendarViewRange(
  view: CalendarViewKind,
  anchor: Date,
): { start: string; end: string } {
  const start = new Date(anchor);
  const end = new Date(anchor);

  if (view === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0); // last day of the anchor's month
    end.setHours(23, 59, 59, 999);
  } else if (view === "week") {
    const day = (anchor.getDay() + 6) % 7; // Monday-first
    start.setDate(anchor.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  start.setDate(start.getDate() - CALENDAR_VIEW_BUFFER_DAYS);
  end.setDate(end.getDate() + CALENDAR_VIEW_BUFFER_DAYS);

  return { start: start.toISOString(), end: end.toISOString() };
}
