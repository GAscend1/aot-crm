import type { TeamsMeeting } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events } from "./events";
import { integrations } from "@/config/integrations";
import { graphPendingError } from "./integration-gate";

class TeamsService {
  async createMeeting(data: {
    subject: string;
    body?: string;
    start: string;
    end: string;
    participants: { name: string; email: string }[];
  }): Promise<TeamsMeeting> {
    if (integrations.microsoftGraphMode !== "active") {
      throw graphPendingError("Microsoft Teams");
    }
    const res = await fetch("/api/integrations/microsoft/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 503) throw graphPendingError("Microsoft Teams");
      throw new Error(body.error || "Failed to create Teams meeting");
    }
    const meeting = (await res.json()) as TeamsMeeting;
    eventBus.emit(Events.TEAMS_MEETING_CREATED, { ...meeting, entityId: meeting.id });
    return meeting;
  }

  async getMeetings(): Promise<TeamsMeeting[]> {
    const res = await fetch("/api/integrations/microsoft/meetings");
    if (!res.ok) {
      if (res.status === 503) throw graphPendingError("Microsoft Teams");
      throw new Error("Failed to load Teams meetings");
    }
    const data = (await res.json()) as TeamsMeeting[];
    return data.sort((a, b) => a.start.localeCompare(b.start));
  }

  async getMeeting(id: string): Promise<TeamsMeeting | null> {
    const meetings = await this.getMeetings();
    return meetings.find((m) => m.id === id) || null;
  }

  async deleteMeeting(id: string): Promise<void> {
    const res = await fetch(`/api/integrations/microsoft/meetings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      if (res.status === 503) throw graphPendingError("Microsoft Teams");
      throw new Error("Failed to delete Teams meeting");
    }
  }
}

export const teamsService = new TeamsService();
