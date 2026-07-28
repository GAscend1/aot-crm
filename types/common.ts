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
