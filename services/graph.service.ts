import { integrations } from "@/config/integrations";
import type { UserProfile } from "@/types/common";

const mockProfile: UserProfile = {
  id: "user-1",
  displayName: "Glenn Ugay",
  email: "glennu@ascendonetech.com",
  jobTitle: "Senior Software Engineer",
  department: "Engineering",
  manager: "Sarah Chen",
  phone: "+1 (555) 123-4567",
  mobilePhone: "+1 (555) 987-6543",
  officeLocation: "San Francisco, CA",
  photoUrl: "",
  presence: "Available",
};

class GraphService {
  private graphClient: unknown = null;

  async getProfile(): Promise<UserProfile> {
    if (integrations.useMicrosoftGraph) {
      try {
        const client = await this.getClient();
        const user = await client.api("/me").get() as {
          id: string; displayName: string; mail?: string; userPrincipalName: string;
          jobTitle?: string; department?: string; businessPhones?: string[];
          mobilePhone?: string; officeLocation?: string;
        };
        const photo = await this.getPhoto();
        const presence = await this.getPresence();
        return {
          id: user.id,
          displayName: user.displayName,
          email: user.mail || user.userPrincipalName,
          jobTitle: user.jobTitle || "",
          department: user.department || "",
          manager: "",
          phone: user.businessPhones?.[0] || "",
          mobilePhone: user.mobilePhone || "",
          officeLocation: user.officeLocation || "",
          photoUrl: photo,
          presence,
        };
      } catch {
        return mockProfile;
      }
    }
    return mockProfile;
  }

  async getManager(): Promise<{ name: string; email: string } | null> {
    if (integrations.useMicrosoftGraph) {
      try {
        const client = await this.getClient();
        const manager = await client.api("/me/manager").get() as { displayName: string; mail?: string };
        return { name: manager.displayName, email: manager.mail || "" };
      } catch {
        return { name: "Sarah Chen", email: "sarah.chen@ascendonetech.com" };
      }
    }
    return { name: "Sarah Chen", email: "sarah.chen@ascendonetech.com" };
  }

  async getPhoto(): Promise<string> {
    if (integrations.useMicrosoftGraph) {
      try {
        const client = await this.getClient();
        const photo = await client.api("/me/photo/$value").get();
        const base64 = Buffer.from(photo as ArrayBuffer).toString("base64");
        return `data:image/jpeg;base64,${base64}`;
      } catch {
        return "";
      }
    }
    return "";
  }

  async getPresence(): Promise<UserProfile["presence"]> {
    if (integrations.useMicrosoftGraph) {
      try {
        const client = await this.getClient();
        const presence = await client.api("/me/presence").get() as { availability: UserProfile["presence"] };
        return presence.availability;
      } catch {
        return "Available";
      }
    }
    return "Available";
  }

  private async getClient(): Promise<{
    api: (path: string) => { get: () => Promise<unknown> };
  }> {
    if (!this.graphClient) {
      const { Client } = await import("@microsoft/microsoft-graph-client");
      this.graphClient = Client.initWithMiddleware({ authProvider: { getAccessToken: async () => "" } });
    }
    return this.graphClient as never;
  }
}

export const graphService = new GraphService();
