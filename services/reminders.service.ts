import { v4 as uuid } from "uuid";
import type { Reminder } from "@/types/common";

const STORAGE_KEY = "crm-reminders";

class RemindersService {
  private get(): Reminder[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  private save(items: Reminder[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  async getAll(): Promise<Reminder[]> {
    return this.get().sort((a, b) => a.date.localeCompare(b.date));
  }

  async getUpcoming(): Promise<Reminder[]> {
    const now = new Date().toISOString();
    return this.get()
      .filter((r) => !r.completed && r.date >= now)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getOverdue(): Promise<Reminder[]> {
    const now = new Date().toISOString();
    return this.get()
      .filter((r) => !r.completed && r.date < now)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async create(data: Omit<Reminder, "id" | "createdAt">): Promise<Reminder> {
    const reminder: Reminder = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    const items = this.get();
    items.push(reminder);
    this.save(items);
    return reminder;
  }

  async update(id: string, data: Partial<Reminder>): Promise<Reminder> {
    const items = this.get();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Reminder not found");
    items[idx] = { ...items[idx], ...data };
    this.save(items);
    return items[idx];
  }

  async delete(id: string): Promise<void> {
    const items = this.get().filter((r) => r.id !== id);
    this.save(items);
  }

  async toggleComplete(id: string): Promise<Reminder> {
    const items = this.get();
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Reminder not found");
    items[idx] = { ...items[idx], completed: !items[idx].completed };
    this.save(items);
    return items[idx];
  }
}

export const remindersService = new RemindersService();
