import type { UserProfile } from "@/types/common";
import { graphApi, GraphClientError } from "./graph-client";
import { graphPendingError, isGraphPending } from "./integration-gate";

class GraphService {
  async getProfile(): Promise<UserProfile> {
    try {
      const profile = await graphApi("/me") as {
        id: string; displayName: string; email: string;
        jobTitle: string; department: string; manager: string;
        phone: string; mobilePhone: string; officeLocation: string;
      };

      let photoUrl = "";
      try {
        photoUrl = await this.getPhoto();
      } catch {
        photoUrl = "";
      }

      let presence: UserProfile["presence"] = "Available";
      try {
        presence = await this.getPresence();
      } catch {
        presence = "Available";
      }

      return {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email,
        jobTitle: profile.jobTitle,
        department: profile.department,
        manager: profile.manager,
        phone: profile.phone,
        mobilePhone: profile.mobilePhone,
        officeLocation: profile.officeLocation,
        photoUrl,
        presence,
      };
    } catch (err) {
      if (isGraphPending(err)) throw graphPendingError("Microsoft profile");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to load profile: ${err.message}`);
      }
      throw new Error("Failed to load profile");
    }
  }

  async getManager(): Promise<{ name: string; email: string } | null> {
    try {
      const profile = await graphApi("/me/manager") as { manager: string };
      return { name: profile.manager, email: "" };
    } catch (err) {
      if (isGraphPending(err)) throw graphPendingError("Microsoft profile");
      if (err instanceof GraphClientError) {
        throw new Error(`Failed to load manager: ${err.message}`);
      }
      throw new Error("Failed to load manager");
    }
  }

  async getPhoto(): Promise<string> {
    try {
      const res = await fetch("/api/integrations/microsoft/photo");
      if (!res.ok) {
        if (res.status === 503) return "";
        throw new Error("Photo not found");
      }
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  }

  async getPresence(): Promise<UserProfile["presence"]> {
    try {
      const result = await graphApi("/me/presence") as { availability: UserProfile["presence"] };
      return result.availability;
    } catch {
      return "Available";
    }
  }
}

export const graphService = new GraphService();
