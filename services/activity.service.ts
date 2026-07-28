import { BaseService } from "./base/BaseService";
import { MockRepository } from "@/repositories/mock/MockRepository";

export type ActivityType = "Meeting" | "Call" | "Email" | "Task" | "Reminder";
export type ActivityStatus = "Planned" | "In Progress" | "Completed" | "Cancelled";
export type RelatedType = "lead" | "opportunity" | "customer" | "ticket";

interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description: string;
  date: string;
  time: string;
  owner: string;
  status: ActivityStatus;
  relatedTo: string;
  relatedType: RelatedType;
  reminder: string;
  createdAt: string;
  updatedAt: string;
}

export class ActivityService extends BaseService<Activity> {
  protected repository: MockRepository<Activity>;
  protected entityName = "activity";

  constructor(initialData: Activity[] = []) {
    super();
    this.repository = new MockRepository<Activity>(initialData);
  }
}

export type { Activity };
