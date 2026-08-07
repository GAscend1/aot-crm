"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Video, ExternalLink, Copy, Link2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { zoomService } from "@/services/zoom.service";
import { useToastContext } from "@/app/(app)/AppProviders";
import { integrations } from "@/config/integrations";
import type { ZoomMeeting } from "@/types/common";

interface ZoomMeetingDialogProps {
  open: boolean;
  onClose: () => void;
  entityName?: string;
}

/**
 * Zoom meeting dialog.
 *
 * Zoom is NOT configured in this deployment (no Zoom OAuth app exists), so the
 * dialog reports `NOT CONFIGURED` with a clear "Zoom is not configured." state
 * instead of faking a connection. If `NEXT_PUBLIC_USE_ZOOM=true` is ever set
 * AND a real Zoom backend exists, the create form is shown and failures are
 * surfaced honestly.
 */
export function ZoomMeetingDialog({ open, onClose, entityName }: ZoomMeetingDialogProps) {
  const { success, error: showError } = useToastContext();
  const [topic, setTopic] = useState(entityName ? `Meeting with ${entityName}` : "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [meeting, setMeeting] = useState<ZoomMeeting | null>(null);
  const [creating, setCreating] = useState(false);

  const configured = integrations.useZoom;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const startTimeISO = `${date}T${startTime}:00.000Z`;
      const result = await zoomService.createMeeting({
        topic,
        startTime: startTimeISO,
        duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setMeeting(result);
      success("Zoom meeting created");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create Zoom meeting");
    } finally {
      setCreating(false);
    }
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
                <Video className="h-4 w-4 text-[color:var(--chart-6)]" />
                Zoom Meeting
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {!configured ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft">
                  <AlertTriangle className="h-6 w-6 text-[color:var(--warning)]" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Zoom is not configured.</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Contact your administrator to enable the Zoom integration.
                    The rest of the CRM keeps working normally.
                  </p>
                </div>
                <DialogPrimitive.Close render={<Button variant="outline">Got it</Button>} />
              </div>
            ) : meeting ? (
              <div className="space-y-4 p-4">
                <div className="rounded-lg bg-[color:var(--chart-6)]/[0.08] p-4">
                  <h3 className="font-medium text-foreground">{meeting.topic}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(meeting.startTime).toLocaleString()} · {meeting.duration} min
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

                  {meeting.password && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Password</p>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          {meeting.password}
                        </code>
                        <Button variant="ghost" size="icon-xs" onClick={() => copyToClipboard(meeting.password)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
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
                <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4 text-[color:var(--success)]" />
                  <span>Zoom integration enabled — create a meeting below.</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Topic</label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Meeting topic"
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
                    <label className="text-xs font-medium text-muted-foreground">Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Duration (min)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min={15}
                      step={15}
                      className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                </div>

                <Button onClick={handleCreate} disabled={creating || !topic} className="w-full">
                  {creating ? "Creating..." : "Create Zoom Meeting"}
                </Button>
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
