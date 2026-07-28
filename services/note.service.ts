import { v4 as uuid } from "uuid";
import type { Note } from "@/types/common";
import { eventBus } from "./event-bus";
import { Events, type EntityEventPayload } from "./events";

class NoteService {
  private notes: Note[] = [];

  async getByEntity(entityType: string, entityId: string): Promise<Note[]> {
    return this.notes
      .filter((n) => n.entityType === entityType && n.entityId === entityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(data: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<Note> {
    const note: Note = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.notes.push(note);
    const payload: EntityEventPayload = {
      entityType: note.entityType,
      entityId: note.entityId,
      action: "created",
      data: { noteId: note.id, content: note.content },
    };
    eventBus.emit(Events.NOTE_ADDED, payload);
    return note;
  }

  async update(id: string, content: string): Promise<Note> {
    const idx = this.notes.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error("Note not found");
    this.notes[idx] = { ...this.notes[idx], content, updatedAt: new Date().toISOString() };
    return this.notes[idx];
  }

  async delete(id: string): Promise<void> {
    this.notes = this.notes.filter((n) => n.id !== id);
  }
}

export const noteService = new NoteService();
