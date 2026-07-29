"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Video, ExternalLink, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { zoomService } from "@/services/zoom.service";
import { useToastContext } from "@/app/(app)/AppProviders";
import type { ZoomMeeting, ZoomAccount } from "@/types/common";

interface ZoomMeetingDialogProps {
  open: boolean;
  onClose: () => void;
  entityName?: string;
}

export function ZoomMeetingDialog({ open, onClose, entityName }: ZoomMeetingDialogProps) {
  const { success, error: showError } = useToastContext();
  const [account, setAccount] = useState<ZoomAccount | null>(null);
  const [topic, setTopic] = useState(entityName ? `Meeting with ${entityName}` : "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [meeting, setMeeting] = useState<ZoomMeeting | null>(null);
  const [creating, setCreating] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useState(() => { zoomService.getAccount().then(setAccount); });

  const handleConnect = async () => {
    setConnecting(true);
    await zoomService.connectAccount("user@company.com", "Current User");
    setAccount({ connected: true, email: "user@company.com", displayName: "Current User", connectedAt: new Date().toISOString() });
    setConnecting(false);
    success("Zoom account connected");
  };

  const handleDisconnect = async () => {
    await zoomService.disconnectAccount();
    setAccount(null);
    success("Zoom account disconnected");
  };

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
          <div className="flex w-full max-w-lg flex-col rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Video className="h-4 w-4 text-blue-500" />
                Zoom Meeting
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {!account?.connected ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <Video className="h-12 w-12 text-blue-400" />
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Connect Zoom Account</h3>
                  <p className="mt-1 text-sm text-slate-500">Connect your Zoom account to create and manage meetings.</p>
                </div>
                <Button onClick={handleConnect} disabled={connecting}>
                  {connecting ? "Connecting..." : "Connect Zoom Account"}
                </Button>
              </div>
            ) : meeting ? (
              <div className="space-y-4 p-4">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                  <h3 className="font-medium text-slate-900 dark:text-white">{meeting.topic}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(meeting.startTime).toLocaleString()} · {meeting.duration} min
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Join URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                        {meeting.joinUrl}
                      </code>
                      <Button variant="ghost" size="icon-xs" onClick={() => copyToClipboard(meeting.joinUrl)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Password</p>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs font-mono dark:bg-slate-800">
                        {meeting.password}
                      </code>
                      <Button variant="ghost" size="icon-xs" onClick={() => copyToClipboard(meeting.password)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => window.open(meeting.joinUrl, "_blank")}>
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
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="flex items-center gap-2 text-sm">
                    <Link2 className="h-4 w-4 text-green-500" />
                    <span className="text-slate-600 dark:text-slate-300">Connected as {account.email}</span>
                  </div>
                  <Button variant="ghost" size="xs" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">Topic</label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Meeting topic"
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Duration (min)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min={15}
                      step={15}
                      className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
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
