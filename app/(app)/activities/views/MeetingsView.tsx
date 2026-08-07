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
import { IntegrationStateBanner } from "@/components/common/IntegrationStateBanner";
import { TeamsMeetingDialog } from "@/components/integrations/TeamsMeetingDialog";
import { ZoomMeetingDialog } from "@/components/integrations/ZoomMeetingDialog";
import { teamsService } from "@/services/teams.service";
import { zoomService } from "@/services/zoom.service";
import {
  classifyTeamsError,
  isNotConfiguredError,
  type IntegrationStatus,
} from "@/services/integration-gate";
import { integrations } from "@/config/integrations";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import type { TeamsMeeting, ZoomMeeting } from "@/types/common";
import { cn } from "@/lib/utils";

/**
 * Meetings view of the Activities module (merged from the old /activities/meetings
 * page). Meetings are activities in the same work engine as everything else.
 *
 * Microsoft Teams and Zoom are INDEPENDENT providers:
 * - A Teams failure is reported as "Microsoft Teams unavailable" — it never
 *   implies Outlook/Calendar or the rest of Microsoft 365 is down.
 * - Zoom not being configured is a graceful NOT CONFIGURED state, not an error.
 */
export function MeetingsView() {
  const [teams, setTeams] = useState<TeamsMeeting[]>([]);
  const [zoom, setZoom] = useState<ZoomMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsStatus, setTeamsStatus] = useState<IntegrationStatus | null>(null);
  const [zoomError, setZoomError] = useState<string | null>(null);
  // True when the Zoom backend itself reports NOT configured (even if the
  // client flag is on — e.g. NEXT_PUBLIC_USE_ZOOM=true with no backend).
  const [zoomDisabled, setZoomDisabled] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const zoomConfigured = integrations.useZoom;

  const load = useCallback(() => {
    // Initial state is already loading; retries intentionally keep the current
    // list visible instead of flashing a full-screen spinner.
    Promise.allSettled([
      teamsService.getMeetings(),
      // When Zoom is not configured, don't call its API at all — the section
      // renders the graceful "Zoom is not configured" state instead.
      zoomConfigured ? zoomService.getMeetings() : Promise.resolve([] as ZoomMeeting[]),
    ])
      .then(([teamsResult, zoomResult]) => {
        if (teamsResult.status === "fulfilled") {
          setTeams(teamsResult.value);
          setTeamsStatus(null);
        } else {
          setTeamsStatus(classifyTeamsError(teamsResult.reason));
        }

        if (zoomResult.status === "fulfilled") {
          setZoom(zoomResult.value);
          setZoomError(null);
          setZoomDisabled(false);
        } else if (isNotConfiguredError(zoomResult.reason)) {
          // Backend reports NOT CONFIGURED — graceful state, not an error.
          setZoomDisabled(true);
          setZoomError(null);
        } else {
          setZoomError("Could not load Zoom meetings.");
        }
      })
      .catch(() => setTeamsStatus(classifyTeamsError(new Error("Could not load meetings."))))
      .finally(() => setLoading(false));
  }, [zoomConfigured]);

  useEffect(() => {
    load();
  }, [load]);

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <FeatureGate feature="teams" featureLabel="Teams meetings" mode="hide">
          <Button variant="outline" size="sm" onClick={() => setTeamsOpen(true)}>
            <Video className="mr-1.5 h-4 w-4" />
            Teams
          </Button>
        </FeatureGate>
        <FeatureGate feature="zoom" featureLabel="Zoom meetings" mode="hide">
          <Button size="sm" onClick={() => setZoomOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Zoom Meeting
          </Button>
        </FeatureGate>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Microsoft Teams — independent provider */}
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Video className="h-4 w-4 text-[color:var(--chart-5)]" />
                Microsoft Teams
              </h2>
              <div className="flex items-center gap-2">
                <StateChip
                  label={teamsStatus?.state ?? "CONNECTED"}
                  tone={teamsStatus ? "warning" : "success"}
                />
                <FeatureGate feature="teams" featureLabel="Teams meetings" mode="hide">
                  <Button variant="ghost" size="xs" onClick={() => setTeamsOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" />
                    New
                  </Button>
                </FeatureGate>
              </div>
            </div>

            {teamsStatus && (
              <div className="border-b px-4 py-3">
                <IntegrationStateBanner status={teamsStatus} onRetry={load} />
              </div>
            )}

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

          {/* Zoom — independent provider */}
          <section className="rounded-xl border bg-surface-raised">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MonitorPlay className="h-4 w-4 text-[color:var(--chart-6)]" />
                Zoom
              </h2>
              <div className="flex items-center gap-2">
                <StateChip
                  label={zoomConfigured && !zoomDisabled ? "CONNECTED" : "NOT CONFIGURED"}
                  tone={zoomConfigured && !zoomDisabled ? "success" : "warning"}
                />
                <FeatureGate feature="zoom" featureLabel="Zoom meetings" mode="hide">
                  <Button variant="ghost" size="xs" onClick={() => setZoomOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" />
                    New
                  </Button>
                </FeatureGate>
              </div>
            </div>

            {zoomError && (
              <div className="border-b px-4 py-3">
                <IntegrationWarning
                  title="Could not load Zoom meetings"
                  message={zoomError}
                  action={{ label: "Retry", onClick: load }}
                />
              </div>
            )}

            <div className="divide-y">
              {!zoomConfigured || zoomDisabled ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Zoom is not configured. Contact your administrator to enable the Zoom
                  integration — the rest of the CRM keeps working normally.
                </p>
              ) : zoom.length === 0 ? (
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

      <FeatureGate feature="teams" featureLabel="Teams meetings" mode="hide">
        <TeamsMeetingDialog open={teamsOpen} onClose={() => setTeamsOpen(false)} />
      </FeatureGate>
      <ZoomMeetingDialog open={zoomOpen} onClose={() => setZoomOpen(false)} />
    </div>
  );
}

function StateChip({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide sm:inline-flex",
        tone === "success"
          ? "bg-success-soft text-[color:var(--success)]"
          : "bg-warning-soft text-[color:var(--warning)]"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "success" ? "bg-[color:var(--success)]" : "bg-[color:var(--warning)]"
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
