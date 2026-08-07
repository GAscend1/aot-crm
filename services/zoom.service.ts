import type { ZoomMeeting, ZoomAccount } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";
import { integrations } from "@/config/integrations";

class ZoomService {
  private account: ZoomAccount = { connected: false, email: "", displayName: "", connectedAt: "" };
  private meetings: ZoomMeeting[] = [];

  async connectAccount(email: string, displayName: string): Promise<ZoomAccount> {
    if (!integrations.useZoom) {
      throw new Error("Zoom integration is not enabled. Contact your administrator.");
    }
    this.account = {
      connected: true,
      email,
      displayName,
      connectedAt: new Date().toISOString(),
    };
    return this.account;
  }

  async disconnectAccount(): Promise<void> {
    this.account = { connected: false, email: "", displayName: "", connectedAt: "" };
  }

  async getAccount(): Promise<ZoomAccount> {
    return this.account;
  }

  async createMeeting(data: {
    topic: string;
    startTime: string;
    duration: number;
    timezone?: string;
    password?: string;
    settings?: { video?: boolean; audio?: string; muteUponEntry?: boolean };
  }): Promise<ZoomMeeting> {
    if (!integrations.useZoom) {
      throw new Error("Zoom integration is not enabled. Contact your administrator.");
    }
    if (!this.account.connected) throw new Error("Zoom account not connected");

    const res = await fetch("/api/integrations/zoom/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      // Surface the API's exact message (e.g. the 503 "not enabled" state)
      // so callers can distinguish NOT CONFIGURED from a real failure.
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        body.error || `Failed to create Zoom meeting (${res.status})`
      );
    }
    const meeting = (await res.json()) as ZoomMeeting;
    eventBus.emit(Events.ZOOM_MEETING_CREATED, { ...meeting, entityId: meeting.id });
    return meeting;
  }

  async getMeetings(): Promise<ZoomMeeting[]> {
    const res = await fetch("/api/integrations/zoom/meetings");
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        body.error || `Failed to load Zoom meetings (${res.status})`
      );
    }
    const data = (await res.json()) as ZoomMeeting[];
    return data.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getMeeting(id: string): Promise<ZoomMeeting | null> {
    const meetings = await this.getMeetings();
    return meetings.find((m) => m.id === id) || null;
  }

  async getMeetingHistory(): Promise<ZoomMeeting[]> {
    const meetings = await this.getMeetings();
    return meetings.filter((m) => m.status === "ended").sort((a, b) => b.startTime.localeCompare(a.startTime));
  }

  async deleteMeeting(id: string): Promise<void> {
    const res = await fetch(`/api/integrations/zoom/meetings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        body.error || `Failed to delete Zoom meeting (${res.status})`
      );
    }
  }
}

export const zoomService = new ZoomService();
