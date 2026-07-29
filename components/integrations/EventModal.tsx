"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calendarService } from "@/services/calendar.service";
import { teamsService } from "@/services/teams.service";
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
  void entityId;
  const { success, error: showError } = useToastContext();
  const isEditing = !!event;
  const [subject, setSubject] = useState(event?.subject || "");
  const [date, setDate] = useState(event?.start?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(event?.start?.slice(11, 16) || "09:00");
  const [endTime, setEndTime] = useState(event?.end?.slice(11, 16) || "10:00");
  const [location, setLocation] = useState(event?.location || "");
  const [body, setBody] = useState(event?.body || "");
  const [isTeams, setIsTeams] = useState(false);
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
          ? { provider: "teams", url: `https://teams.microsoft.com/meeting/${Date.now()}` }
          : { provider: "", url: "" },
        attendees: [],
        organizer: { name: "Current User", email: "user@company.com" },
        showAs: "busy" as const,
        categories,
        recurrence: null,
        reminder: 15,
      };

      if (isEditing && event) {
        await calendarService.update(event.id, data);
        success("Event updated");
      } else {
        await calendarService.create(data);
        if (isTeams) {
          await teamsService.createMeeting({
            subject,
            body,
            start,
            end,
            participants: [],
          });
        }
        success("Event created");
      }
      onSaved?.();
      onClose();
    } catch {
      showError("Failed to save event");
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
    } catch {
      showError("Failed to delete event");
    }
  };

  if (!open) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex w-full max-w-lg flex-col rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {isEditing ? "Edit Event" : "New Event"}
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
                {isEditing && (
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving || !subject}>
                {saving ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
