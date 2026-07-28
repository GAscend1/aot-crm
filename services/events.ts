export const Events = {
  CUSTOMER_CREATED: "customer:created",
  CUSTOMER_UPDATED: "customer:updated",
  CUSTOMER_DELETED: "customer:deleted",

  COMPANY_CREATED: "company:created",
  COMPANY_UPDATED: "company:updated",
  COMPANY_DELETED: "company:deleted",

  CONTACT_CREATED: "contact:created",
  CONTACT_UPDATED: "contact:updated",
  CONTACT_DELETED: "contact:deleted",

  LEAD_CREATED: "lead:created",
  LEAD_UPDATED: "lead:updated",
  LEAD_DELETED: "lead:deleted",

  OPPORTUNITY_CREATED: "opportunity:created",
  OPPORTUNITY_UPDATED: "opportunity:updated",
  OPPORTUNITY_DELETED: "opportunity:deleted",
  OPPORTUNITY_WON: "opportunity:won",
  OPPORTUNITY_LOST: "opportunity:lost",

  ACTIVITY_CREATED: "activity:created",
  ACTIVITY_UPDATED: "activity:updated",
  ACTIVITY_DELETED: "activity:deleted",
  ACTIVITY_COMPLETED: "activity:completed",

  TICKET_CREATED: "ticket:created",
  TICKET_UPDATED: "ticket:updated",
  TICKET_DELETED: "ticket:deleted",

  DOCUMENT_CREATED: "document:created",
  DOCUMENT_UPDATED: "document:updated",
  DOCUMENT_DELETED: "document:deleted",

  NOTE_ADDED: "note:added",

  ATTACHMENT_UPLOADED: "attachment:uploaded",

  EMAIL_SENT: "email:sent",
  EMAIL_DRAFT_SAVED: "email:draft:saved",
  EMAIL_FAILED: "email:failed",

  TEAMS_MEETING_CREATED: "teams:meeting:created",
  TEAMS_MEETING_UPDATED: "teams:meeting:updated",

  ZOOM_MEETING_CREATED: "zoom:meeting:created",
  ZOOM_MEETING_UPDATED: "zoom:meeting:updated",

  CALENDAR_EVENT_CREATED: "calendar:event:created",
  CALENDAR_EVENT_UPDATED: "calendar:event:updated",
  CALENDAR_EVENT_DELETED: "calendar:event:deleted",

  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_COMPLETED: "task:completed",
  TASK_DUE_TODAY: "task:due:today",
  TASK_OVERDUE: "task:overdue",
  TASK_ASSIGNED: "task:assigned",

  CALL_CREATED: "call:created",
  CALL_COMPLETED: "call:completed",
  CALL_MISSED: "call:missed",
  CALL_SCHEDULED: "call:scheduled",
  CALL_DUE: "call:due",

  REMINDER_CREATED: "reminder:created",
  REMINDER_UPDATED: "reminder:updated",

  ASSIGNMENT_CREATED: "assignment:created",
  ASSIGNMENT_UPDATED: "assignment:updated",

  USER_LOGIN: "user:login",
  USER_LOGOUT: "user:logout",

  NOTIFICATION_CREATED: "notification:created",
} as const;

export interface EntityEventPayload {
  entityType: string;
  entityId: string;
  action: "created" | "updated" | "deleted" | "restored" | "archived";
  data?: Record<string, unknown>;
  oldData?: Record<string, unknown>;
  userId?: string;
  userName?: string;
}
