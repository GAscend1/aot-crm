export type ActivityType = "Meeting" | "Call" | "Email" | "Task" | "Reminder";
export type ActivityStatus = "Planned" | "In Progress" | "Completed" | "Cancelled";
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
