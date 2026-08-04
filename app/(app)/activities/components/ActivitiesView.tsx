"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, CalendarDays, CheckSquare, Mail, Video } from "lucide-react";

import { ViewSwitcher } from "@/components/common/ViewSwitcher";
import { ActivityStats } from "./ActivityStats";
import { ActivityTable } from "./ActivityTable";
import { CalendarView } from "../views/CalendarView";
import { TasksView } from "../views/TasksView";
import { MeetingsView } from "../views/MeetingsView";
import { EmailView } from "../views/EmailView";

const VIEWS = [
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "meetings", label: "Meetings", icon: Video },
  { id: "email", label: "Email", icon: Mail },
];

/**
 * Activities module shell. Calendar, Meetings, Email, and Tasks are now views
 * of the same work engine — /activities?view=calendar, ?view=tasks,
 * ?view=meetings, ?view=email.
 */
export function ActivitiesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams?.get("view");
  const active = VIEWS.some((v) => v.id === view)
    ? (view as string)
    : "timeline";

  const handleChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("view", next);
      router.replace(`/activities?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      <ViewSwitcher
        tabs={VIEWS}
        active={active}
        onChange={handleChange}
        tourPrefix="view"
      />

      {active === "timeline" && (
        <>
          <ActivityStats />
          <ActivityTable />
        </>
      )}

      {active === "calendar" && <CalendarView />}

      {active === "tasks" && <TasksView />}

      {active === "meetings" && <MeetingsView />}

      {active === "email" && <EmailView />}
    </div>
  );
}
