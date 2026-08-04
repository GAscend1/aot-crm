"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  MonitorPlay,
  Plus,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IntegrationWarning } from "@/components/common/IntegrationWarning";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";
import { teamsService } from "@/services/teams.service";
import { zoomService } from "@/services/zoom.service";
import type { TeamsMeeting, ZoomMeeting } from "@/types/common";

/**
 * Meetings view of the Activities module (merged from the old /activities/meetings
 * page). Meetings are activities in the same work engine as everything else.
 */
export function MeetingsView() {
  const [teams, setTeams] = useState<TeamsMeeting[]>([]);
  const [zoom, setZoom] = useState<ZoomMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingConsent, setPendingConsent] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const load = useCallback(() => {
    Promise.allSettled([teamsService.getMeetings(), zoomService.getMeetings()])
      .then(([teamsResult, zoomResult]) => {
        if (teamsResult.status === "fulfilled") setTeams(teamsResult.value);
        if (zoomResult.status === "fulfilled") setZoom(zoomResult.value);
        const anyPending = [teamsResult, zoomResult].some(
          (r) => r.status === "rejected" && r.reason instanceof Error && r.reason.message.includes("awaiting administrator approval")
        );
        const anyError = [teamsResult, zoomResult].some((r) => r.status === "rejected");
        if (anyPending) {
          setPendingConsent(true);
          setLoadError(null);
        } else {
          setPendingConsent(false);
          setLoadError(anyError ? "Could not load meeting lists. Microsoft Teams or Zoom may be unavailable." : null);
        }
      })
      .catch(() => setLoadError("Could not load meetings."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-4">
      {pendingConsent && (
        <IntegrationWarning
          title="Meetings are awaiting approval"
          message="Your Microsoft 365 connection is waiting for administrator approval. Teams meetings can't sync right now, but Zoom and the rest of the CRM keep working."
          action={{ label: "Check integration status", onClick: () => window.location.assign("/administration/microsoft-integration") }}
          onDismiss={() => setPendingConsent(false)}
        />
      )}

      {loadError && (
        <IntegrationWarning
          title="Could not load meetings"
          message={loadError}
          onDismiss={() => setLoadError(null)}
        />
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setTeamsOpen(true)}>
          <Video className="mr-1.5 h-4 w-4" />
          Teams
        </Button>
        <Button size="sm" onClick={() => setZoomOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Zoom Meeting
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Teams */}
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Video className="h-4 w-4 text-[color:var(--chart-5)]" />
                Microsoft Teams
              </h2>
              <Button variant="ghost" size="xs" onClick={() => setTeamsOpen(true)}>
                <Plus className="mr-1 h-3 w-3" />
                New
              </Button>
            </div>
            <div className="divide-y">
              {teams.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No Teams meetings scheduled.
                </p>
              ) : (
                teams.map((meeting) => (
                  <div key={meeting.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{meeting.subject}</p>
                      <p className="text-xs text-muted-foreground">{dateFmt(meeting.start)}</p>
                    </div>
                    <a
                      href={meeting.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[color:var(--chart-5)]/[0.12] px-2.5 text-xs font-semibold text-[color:var(--chart-5)] ring-1 ring-inset ring-[color:var(--chart-5)]/25 transition-colors hover:bg-[color:var(--chart-5)]/[0.2]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Join
                    </a>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Zoom */}
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MonitorPlay className="h-4 w-4 text-[color:var(--chart-6)]" />
                Zoom
              </h2>
              <Button variant="ghost" size="xs" onClick={() => setZoomOpen(true)}>
                <Plus className="mr-1 h-3 w-3" />
                New
              </Button>
            </div>
            <div className="divide-y">
              {zoom.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No Zoom meetings scheduled.
                </p>
              ) : (
                zoom.map((meeting) => (
                  <div key={meeting.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{meeting.topic}</p>
                      <p className="text-xs text-muted-foreground">
                        {dateFmt(meeting.startTime)} · {meeting.duration} min
                      </p>
                    </div>
                    <a
                      href={meeting.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[color:var(--chart-6)]/[0.12] px-2.5 text-xs font-semibold text-[color:var(--chart-6)] ring-1 ring-inset ring-[color:var(--chart-6)]/25 transition-colors hover:bg-[color:var(--chart-6)]/[0.2]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Join
                    </a>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <TeamsMeetingDialog open={teamsOpen} onClose={() => setTeamsOpen(false)} />
      <ZoomMeetingDialog open={zoomOpen} onClose={() => setZoomOpen(false)} />
    </div>
  );
}
