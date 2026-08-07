"use client";

import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Video, ExternalLink, Copy, Phone, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teamsService } from "@/services/teams.service";
import { useToastContext } from "@/app/(app)/AppProviders";
import { classifyGraphError, type IntegrationStatus } from "@/services/integration-gate";
import type { TeamsMeeting } from "@/types/common";

interface TeamsMeetingDialogProps {
  open: boolean;
  onClose: () => void;
  entityName?: string;
}

export function TeamsMeetingDialog({ open, onClose, entityName }: TeamsMeetingDialogProps) {
  const { success, error: showError } = useToastContext();
  // Verify Microsoft 365 is actually connected before offering Teams creation.
  // Do not present the form (or mark the feature ready) when the connection is
  // missing/expired — the dialog shows a clear Connect/Unavailable state instead.
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkToken, setCheckToken] = useState(0);
  const [subject, setSubject] = useState(entityName ? `Meeting with ${entityName}` : "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [body, setBody] = useState("");
  const [meeting, setMeeting] = useState<TeamsMeeting | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/integrations/microsoft/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: IntegrationStatus | null) => {
        if (cancelled) return;
        setStatus(body);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus(classifyGraphError(new Error("Could not reach the integration status endpoint")));
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, checkToken]);

  const connected = status?.state === "CONNECTED";

  const handleCreate = async () => {
    setCreating(true);
    try {
      const start = `${date}T${startTime}:00.000Z`;
      const end = `${date}T${endTime}:00.000Z`;
      const result = await teamsService.createMeeting({
        subject,
        body,
        start,
        end,
        participants: [],
      });
      setMeeting(result);
      success("Teams meeting created");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create Teams meeting");
    } finally {
      setCreating(false);
    }
  };

  const reconnect = () => {
    window.location.assign("/api/auth/signin/microsoft-entra-id?callbackUrl=" + encodeURIComponent(window.location.pathname));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success("Copied to clipboard");
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) { onClose(); setMeeting(null); } }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-xl border bg-surface-raised shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Video className="h-4 w-4 text-[color:var(--chart-5)]" />
                Microsoft Teams Meeting
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {!checking && !connected ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft">
                  <AlertTriangle className="h-6 w-6 text-[color:var(--warning)]" />
                </div>
                <div>
                  {/* Provider-specific copy: Teams failures must never be
                      reported as a generic "Microsoft 365 unavailable" when
                      the rest of Microsoft 365 (e.g. Outlook Calendar) works. */}
                  <h3 className="font-medium text-foreground">
                    {status?.state && status.state !== "GRAPH_UNAVAILABLE"
                      ? status.title
                      : "Microsoft Teams unavailable"}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {status?.message ?? "Unable to load/create Teams meetings. The rest of the CRM keeps working."}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setChecking(true);
                      setCheckToken((t) => t + 1);
                    }}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Check again
                  </Button>
                  <Button onClick={reconnect}>Connect Microsoft 365</Button>
                </div>
              </div>
            ) : checking ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking Microsoft 365 connection…
              </div>
            ) : meeting ? (
              <div className="space-y-4 p-4">
                <div className="rounded-lg bg-[color:var(--chart-5)]/[0.08] p-4">
                  <h3 className="font-medium text-foreground">{meeting.subject}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(meeting.start).toLocaleString()} - {new Date(meeting.end).toLocaleTimeString()}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Join URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                        {meeting.joinUrl}
                      </code>
                      <Button variant="ghost" size="icon-xs" onClick={() => copyToClipboard(meeting.joinUrl)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Conference ID</p>
                    <p className="text-sm font-mono">{meeting.conferenceId}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Dial-in Number</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{meeting.dialInNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => window.open(meeting.joinUrl, "_blank", "noopener,noreferrer")}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Join Meeting
                  </Button>
                  <Button variant="outline" onClick={() => setMeeting(null)}>
                    Create Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Meeting subject"
                    className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Start</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">End</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                </div>
                <div>                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="mt-1 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating || !subject} className="w-full">
                  {creating ? "Creating..." : "Create Teams Meeting"}
                </Button>
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
