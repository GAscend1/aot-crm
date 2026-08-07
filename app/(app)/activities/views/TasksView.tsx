"use client";

import { ActivityTable } from "../components/ActivityTable";

/**
 * Tasks view — the Activity list pre-filtered to Task type.
 * Calendar, Meetings, and Email are other views of the same work engine.
 */
export function TasksView() {
  return <ActivityTable defaultTypeFilter="Task" />;
}
