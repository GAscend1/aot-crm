import type { Favorite } from "@/types/common";

const STORAGE_KEY = "crm-favorites";

class FavoritesService {
  private get(): Favorite[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  private save(items: Favorite[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async getAll(): Promise<Favorite[]> {
    return this.get().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async add(entityType: string, entityId: string, title: string): Promise<void> {
    const items = this.get();
    const exists = items.find((f) => f.entityType === entityType && f.entityId === entityId);
    if (!exists) {
      items.push({ entityType, entityId, title, timestamp: new Date().toISOString() });
      this.save(items);
    }
  }

  async remove(entityType: string, entityId: string): Promise<void> {
    const items = this.get().filter(
      (f) => !(f.entityType === entityType && f.entityId === entityId)
    );
    this.save(items);
  }

  async isFavorite(entityType: string, entityId: string): Promise<boolean> {
    const items = this.get();
    return items.some((f) => f.entityType === entityType && f.entityId === entityId);
  }

  async toggle(entityType: string, entityId: string, title: string): Promise<boolean> {
    const isFav = await this.isFavorite(entityType, entityId);
    if (isFav) {
      await this.remove(entityType, entityId);
      return false;
    }
    await this.add(entityType, entityId, title);
    return true;
  }

  async clear(): Promise<void> {
    this.save([]);
  }
}

export const favoritesService = new FavoritesService();
