import { v4 as uuid } from "uuid";
import type { TeamsMeeting } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";

class TeamsService {
  private meetings: TeamsMeeting[] = [];

  async createMeeting(data: {
    subject: string;
    body?: string;
    start: string;
    end: string;
    participants: { name: string; email: string }[];
  }): Promise<TeamsMeeting> {
    const meetingId = uuid();
    const meeting: TeamsMeeting = {
      id: meetingId,
      subject: data.subject,
      body: data.body || "",
      start: data.start,
      end: data.end,
      onlineMeetingUrl: `https://teams.microsoft.com/meeting/${meetingId}`,
      joinUrl: `https://teams.microsoft.com/l/meetup-join/19:${meetingId}/0`,
      conferenceId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      dialInNumber: "+1 (555) 123-4567",
      participants: data.participants,
      organizer: { name: "Current User", email: "user@company.com" },
      createdAt: new Date().toISOString(),
    };
    this.meetings.push(meeting);
    eventBus.emit(Events.TEAMS_MEETING_CREATED, { ...meeting, entityId: meeting.id });
    return meeting;
  }

  async getMeetings(): Promise<TeamsMeeting[]> {
    return this.meetings.sort((a, b) => a.start.localeCompare(b.start));
  }

  async getMeeting(id: string): Promise<TeamsMeeting | null> {
    return this.meetings.find((m) => m.id === id) || null;
  }

  async deleteMeeting(id: string): Promise<void> {
    this.meetings = this.meetings.filter((m) => m.id !== id);
  }

  getJoinUrl(meeting: TeamsMeeting): string {
    return meeting.joinUrl;
  }
}

export const teamsService = new TeamsService();
