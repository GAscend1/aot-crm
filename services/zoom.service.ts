import { v4 as uuid } from "uuid";
import type { ZoomMeeting, ZoomAccount } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";

class ZoomService {
  private account: ZoomAccount = { connected: false, email: "", displayName: "", connectedAt: "" };
  private meetings: ZoomMeeting[] = [];

  async connectAccount(email: string, displayName: string): Promise<ZoomAccount> {
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
    if (!this.account.connected) throw new Error("Zoom account not connected");

    const meetingId = uuid();
    const meeting: ZoomMeeting = {
      id: meetingId,
      topic: data.topic,
      startTime: data.startTime,
      duration: data.duration,
      timezone: data.timezone || "UTC",
      joinUrl: `https://zoom.us/j/${meetingId.replace(/-/g, "").slice(0, 10)}`,
      password: data.password || Math.random().toString(36).substring(2, 8),
      hostId: "host-1",
      hostName: this.account.displayName,
      settings: {
        video: data.settings?.video ?? true,
        audio: data.settings?.audio || "both",
        muteUponEntry: data.settings?.muteUponEntry ?? false,
      },
      participants: [],
      status: "upcoming",
      createdAt: new Date().toISOString(),
    };
    this.meetings.push(meeting);
    eventBus.emit(Events.ZOOM_MEETING_CREATED, { ...meeting, entityId: meeting.id });
    return meeting;
  }

  async getMeetings(): Promise<ZoomMeeting[]> {
    return this.meetings.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getMeeting(id: string): Promise<ZoomMeeting | null> {
    return this.meetings.find((m) => m.id === id) || null;
  }

  async getMeetingHistory(): Promise<ZoomMeeting[]> {
    return this.meetings
      .filter((m) => m.status === "ended")
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
  }

  async deleteMeeting(id: string): Promise<void> {
    this.meetings = this.meetings.filter((m) => m.id !== id);
  }

  getJoinUrl(meeting: ZoomMeeting): string {
    return meeting.joinUrl;
  }
}

export const zoomService = new ZoomService();
