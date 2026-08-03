import { BaseService } from "./base/BaseService";
import type { IRepository } from "@/repositories/base/IRepository";

export type ActivityType = "Meeting" | "Call" | "Email" | "Task" | "Note" | "Comment";
export type ActivityStatus = "Planned" | "Completed" | "Cancelled";
export type RelatedType = "lead" | "opportunity" | "customer" | "ticket";

export interface Activity {
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
  protected repository: IRepository<Activity>;
  protected entityName = "activity";

  constructor(repository: IRepository<Activity>) {
    super();
    this.repository = repository;
  }
}
