import { v4 as uuid } from "uuid";
import type { AuditEntry } from "@/types/common";

class AuditService {
  private entries: AuditEntry[] = [];

  async log(data: Omit<AuditEntry, "id" | "timestamp">): Promise<AuditEntry> {
    const entry: AuditEntry = {
      ...data,
      id: uuid(),
      timestamp: new Date().toISOString(),
    };
    this.entries.unshift(entry);

    try {
      const stored = JSON.parse(localStorage.getItem("crm-audit-log") || "[]");
      stored.unshift(entry);
      localStorage.setItem("crm-audit-log", JSON.stringify(stored.slice(0, 1000)));
    } catch {}

    return entry;
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditEntry[]> {
    return this.entries.filter(
      (e) => e.entityType === entityType && e.entityId === entityId
    );
  }

  async findAll(page = 1, pageSize = 50): Promise<{ data: AuditEntry[]; total: number }> {
    const start = (page - 1) * pageSize;
    return {
      data: this.entries.slice(start, start + pageSize),
      total: this.entries.length,
    };
  }
}

export const auditService = new AuditService();
