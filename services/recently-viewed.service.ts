import type { RecentlyViewed } from "@/types/common";

const STORAGE_KEY = "crm-recently-viewed";
const MAX_ITEMS = 20;

class RecentlyViewedService {
  private get(): RecentlyViewed[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  private save(items: RecentlyViewed[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async getAll(): Promise<RecentlyViewed[]> {
    return this.get().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async track(entityType: string, entityId: string, title: string): Promise<void> {
    const items = this.get().filter(
      (r) => !(r.entityType === entityType && r.entityId === entityId)
    );
    items.unshift({ entityType, entityId, title, timestamp: new Date().toISOString() });
    this.save(items.slice(0, MAX_ITEMS));
  }

  async clear(): Promise<void> {
    this.save([]);
  }
}

export const recentlyViewedService = new RecentlyViewedService();
