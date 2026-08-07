export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  label: string;
  color?: string;
}

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: "created" | "updated" | "deleted" | "restored" | "archived";
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface Note {
  id: string;
  entityType: string;
  entityId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedView {
  id: string;
  name: string;
  entityType: string;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  visibleColumns?: string[];
  isDefault?: boolean;
  userId: string;
  createdAt: string;
}

export interface RecentlyViewed {
  entityType: string;
  entityId: string;
  title: string;
  timestamp: string;
}

export interface Favorite {
  entityType: string;
  entityId: string;
  title: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category?: string;
  entityType?: string;
  entityId?: string;
}

export interface BulkAction {
  label: string;
  action: string;
  icon?: React.ElementType;
  variant?: "default" | "destructive" | "outline";
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: string;
  manager: string;
  phone: string;
  mobilePhone: string;
  officeLocation: string;
  photoUrl: string;
  presence: "Available" | "Busy" | "DoNotDisturb" | "BeRightBack" | "Away" | "Offline";
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  body: string;
  bodyPreview: string;
  sender: { name: string; email: string };
  to: { name: string; email: string }[];
  cc: { name: string; email: string }[];
  bcc: { name: string; email: string }[];
  attachments: EmailAttachment[];
  isRead: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  importance: "low" | "normal" | "high";
  sentAt: string;
  receivedAt: string;
  categories: string[];
}

export interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  subject: string;
  body: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location: string;
  onlineMeeting: { provider: string; url: string };
  attendees: { name: string; email: string; status: string }[];
  organizer: { name: string; email: string };
  showAs: "free" | "tentative" | "busy" | "oof" | "workingElsewhere" | "unknown";
  categories: string[];
  recurrence: string | null;
  reminder: number;
  createdAt: string;
  updatedAt: string;
  /** Microsoft 365 sync state (NOT_SYNCED | SYNCING | SYNCED | ERROR | DELETED). */
  graphSyncStatus?: string;
  syncError?: string | null;
  lastSyncedAt?: string | null;
  timeZone?: string;
}

export interface TeamsMeeting {
  id: string;
  subject: string;
  body: string;
  start: string;
  end: string;
  onlineMeetingUrl: string;
  joinUrl: string;
  conferenceId: string;
  dialInNumber: string;
  participants: { name: string; email: string }[];
  organizer: { name: string; email: string };
  createdAt: string;
}

export interface ZoomMeeting {
  id: string;
  topic: string;
  startTime: string;
  duration: number;
  timezone: string;
  joinUrl: string;
  password: string;
  hostId: string;
  hostName: string;
  settings: { video: boolean; audio: string; muteUponEntry: boolean };
  participants: { name: string; email: string; joinTime: string; leaveTime: string }[];
  status: "upcoming" | "inProgress" | "ended";
  createdAt: string;
}

export interface ZoomAccount {
  connected: boolean;
  email: string;
  displayName: string;
  connectedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: "image" | "pdf" | "office" | "other";
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  entityType?: string;
  entityId?: string;
}

export interface QuickCreateOption {
  label: string;
  icon: React.ElementType;
  href: string;
  description: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  entityType?: string;
  entityId?: string;
  completed: boolean;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  status: "pending" | "inProgress" | "completed";
  createdAt: string;
}
