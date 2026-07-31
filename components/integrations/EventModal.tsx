"use client";

import { useState, useEffect } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  X, Video, Calendar, MapPin, Users, Clock, Link as LinkIcon,
  ExternalLink, Edit3, Trash2, CheckCircle2, StickyNote, Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { calendarService } from "@/services/calendar.service";
import { useToastContext } from "@/app/(app)/AppProviders";
import type { CalendarEvent } from "@/types/common";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  entityType?: string;
  entityId?: string;
  onSaved?: () => void;
}

export function EventModal({ open, onClose, event, entityType, entityId, onSaved }: EventModalProps) {
  const { success, error: showError } = useToastContext();
  const isExisting = !!event;
  const [view, setView] = useState<"details" | "edit">(event ? "details" : "edit");
  const [providerMode, setProviderMode] = useState<"live" | "mock">("mock");

  useEffect(() => {
    fetch("/api/integrations/microsoft/status")
      .then((r) => r.json())
      .then((data: { enabled: boolean }) => setProviderMode(data.enabled ? "live" : "mock"))
      .catch(() => setProviderMode("mock"));
  }, []);

  const [subject, setSubject] = useState(event?.subject || "");
  const [date, setDate] = useState(event?.start?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(event?.start?.slice(11, 16) || "09:00");
  const [endTime, setEndTime] = useState(event?.end?.slice(11, 16) || "10:00");
  const [location, setLocation] = useState(event?.location || "");
  const [body, setBody] = useState(event?.body || "");
  const [isTeams, setIsTeams] = useState(event?.onlineMeeting?.provider === "teams" || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const start = `${date}T${startTime}:00.000Z`;
      const end = `${date}T${endTime}:00.000Z`;
      const categories = [...(event?.categories || [])];
      if (entityType) categories.push(entityType);

      const data = {
        subject,
        body,
        start,
        end,
        isAllDay: false,
        location,
        onlineMeeting: isTeams
          ? { provider: "teams", url: "" }
          : { provider: "", url: "" },
        attendees: [],
        organizer: { name: "", email: "" },
        showAs: "busy" as const,
        categories,
        recurrence: null,
        reminder: 15,
      };

      if (isExisting && event) {
        await calendarService.update(event.id, data);
        success("Event updated");
      } else {
        await calendarService.create(data);
        success("Event created");
        if (entityType === "opportunity" && entityId) {
          // In-app notification only — email is gated behind Microsoft Graph consent.
          void fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "Info",
              title: "Meeting scheduled",
              message: `"${subject}" was scheduled for ${date}`,
              entityType: "opportunity",
              entityId,
              actionLink: `/opportunities/${entityId}`,
            }),
          }).catch(() => {});
        }
      }
      onSaved?.();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      await calendarService.delete(event.id);
      success("Event deleted");
      onSaved?.();
      onClose();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  if (!open) return null;

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "long", timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">

            {view === "details" && event ? (
              <>
                <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Meeting Details</h2>
                  <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                    <X className="h-4 w-4" />
                  </DialogPrimitive.Close>
                </div>

                <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{event.subject}</h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {event.onlineMeeting?.provider === "teams" ? "Teams Meeting" : "Outlook Event"}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                      {providerMode === "live" ? "Live" : "Mock"}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span>{formatDateTime(event.start)} – {formatDateTime(event.end)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">UTC</div>
                  </div>

                  {event.organizer?.name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4" />
                      <span>{event.organizer.name}{event.organizer.email ? ` <${event.organizer.email}>` : ""}</span>
                    </div>
                  )}

                  {event.attendees.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500">Attendees</p>
                      <div className="mt-1 space-y-1">
                        {event.attendees.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Users className="h-3.5 w-3.5" />
                            <span>{a.name || a.email} ({a.status})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.body && (
                    <div>
                      <p className="text-xs font-medium text-slate-500">Description</p>
                      <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap dark:text-slate-400">{event.body}</p>
                    </div>
                  )}

                  {event.onlineMeeting?.url && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                        <Video className="h-4 w-4" />
                        Teams meeting created
                      </div>
                      <p className="mt-1 text-xs text-blue-600 break-all dark:text-blue-400">{event.onlineMeeting.url}</p>
                    </div>
                  )}

                  {event.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.categories.map((c, i) => (
                        <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800 dark:text-slate-300">{c}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3 dark:border-slate-800">
                  {event.onlineMeeting?.url && (
                    <>
                      <a href={event.onlineMeeting.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm"><Video className="mr-1.5 h-3.5 w-3.5" /> Join Meeting</Button>
                      </a>
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(event.onlineMeeting!.url!);
                        success("Link copied");
                      }}>
                        <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Copy Link
                      </Button>
                    </>
                  )}
                  {event.onlineMeeting?.url && (
                    <a href={event.onlineMeeting.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open in Outlook</Button>
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setView("edit")}>
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDelete}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Cancel
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Completed
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <StickyNote className="mr-1.5 h-3.5 w-3.5" /> Add Notes
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Repeat className="mr-1.5 h-3.5 w-3.5" /> Schedule Next
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isExisting ? "Edit Event" : "New Event"}
                  </h2>
                  <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                    <X className="h-4 w-4" />
                  </DialogPrimitive.Close>
                </div>

                <div className="space-y-4 p-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Title</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Event title"
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
                    <label className="text-xs font-medium text-slate-500">Location</label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Room or location"
                      className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isTeams"
                      checked={isTeams}
                      onChange={(e) => setIsTeams(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <label htmlFor="isTeams" className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                      <Video className="h-4 w-4" />
                      Microsoft Teams meeting
                    </label>
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
                </div>

                <div className="flex items-center justify-between border-t px-4 py-3 dark:border-slate-800">
                  <div>
                    {isExisting && (
                      <Button variant="destructive" size="sm" onClick={handleDelete}>
                        Delete
                      </Button>
                    )}
                    {isExisting && (
                      <Button variant="outline" size="sm" className="ml-2" onClick={() => setView("details")}>
                        Cancel
                      </Button>
                    )}
                  </div>
                  <Button onClick={handleSave} disabled={saving || !subject}>
                    {saving ? "Saving..." : isExisting ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </>
            )}

          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
