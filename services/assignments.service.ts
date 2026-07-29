import { v4 as uuid } from "uuid";
import type { Assignment } from "@/types/common";

class AssignmentsService {
  private assignments: Assignment[] = [];

  async getAll(): Promise<Assignment[]> {
    return this.assignments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async getByUser(userId: string): Promise<Assignment[]> {
    return this.assignments
      .filter((a) => a.assignedTo === userId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async getByEntity(entityType: string, entityId: string): Promise<Assignment[]> {
    return this.assignments
      .filter((a) => a.entityType === entityType && a.entityId === entityId)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async create(data: Omit<Assignment, "id" | "createdAt">): Promise<Assignment> {
    const assignment: Assignment = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    this.assignments.push(assignment);
    return assignment;
  }

  async update(id: string, data: Partial<Assignment>): Promise<Assignment> {
    const idx = this.assignments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Assignment not found");
    this.assignments[idx] = { ...this.assignments[idx], ...data };
    return this.assignments[idx];
  }

  async delete(id: string): Promise<void> {
    this.assignments = this.assignments.filter((a) => a.id !== id);
  }
}

export const assignmentsService = new AssignmentsService();
