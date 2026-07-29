"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Video, ExternalLink, Copy, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teamsService } from "@/services/teams.service";
import { useToastContext } from "@/app/(app)/AppProviders";
import type { TeamsMeeting } from "@/types/common";

interface TeamsMeetingDialogProps {
  open: boolean;
  onClose: () => void;
  entityName?: string;
}

export function TeamsMeetingDialog({ open, onClose, entityName }: TeamsMeetingDialogProps) {
  const { success, error: showError } = useToastContext();
  const [subject, setSubject] = useState(entityName ? `Meeting with ${entityName}` : "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [body, setBody] = useState("");
  const [meeting, setMeeting] = useState<TeamsMeeting | null>(null);
  const [creating, setCreating] = useState(false);

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
    } catch {
      showError("Failed to create Teams meeting");
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
                <Video className="h-4 w-4 text-purple-500" />
                Microsoft Teams Meeting
              </h2>
              <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {meeting ? (
              <div className="space-y-4 p-4">
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/30">
                  <h3 className="font-medium text-slate-900 dark:text-white">{meeting.subject}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(meeting.start).toLocaleString()} - {new Date(meeting.end).toLocaleTimeString()}
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
                    <p className="text-xs font-medium text-slate-500 mb-1">Conference ID</p>
                    <p className="text-sm font-mono">{meeting.conferenceId}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Dial-in Number</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm">{meeting.dialInNumber}</span>
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
                <div>
                  <label className="text-xs font-medium text-slate-500">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Meeting subject"
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
                    <label className="text-xs font-medium text-slate-500">Start</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">End</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Description</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="mt-1 w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
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
