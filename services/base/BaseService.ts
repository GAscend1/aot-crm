import type { IRepository, PaginatedResult, QueryOptions } from "@/repositories/base/IRepository";
import { eventBus } from "../event-bus";
import { Events, type EntityEventPayload } from "../events";

function deriveEventKey(entityName: string, action: string): string | null {
  const map: Record<string, Record<string, string>> = {
    customer: { created: Events.CUSTOMER_CREATED, updated: Events.CUSTOMER_UPDATED, deleted: Events.CUSTOMER_DELETED },
    contact: { created: Events.CONTACT_CREATED, updated: Events.CONTACT_UPDATED, deleted: Events.CONTACT_DELETED },
    company: { created: Events.COMPANY_CREATED, updated: Events.COMPANY_UPDATED, deleted: Events.COMPANY_DELETED },
    lead: { created: Events.LEAD_CREATED, updated: Events.LEAD_UPDATED, deleted: Events.LEAD_DELETED },
    opportunity: { created: Events.OPPORTUNITY_CREATED, updated: Events.OPPORTUNITY_UPDATED, deleted: Events.OPPORTUNITY_DELETED },
    activity: { created: Events.ACTIVITY_CREATED, updated: Events.ACTIVITY_UPDATED, deleted: Events.ACTIVITY_DELETED },
    ticket: { created: Events.TICKET_CREATED, updated: Events.TICKET_UPDATED, deleted: Events.TICKET_DELETED },
    document: { created: Events.DOCUMENT_CREATED, updated: Events.DOCUMENT_UPDATED, deleted: Events.DOCUMENT_DELETED },
  };
  return map[entityName]?.[action] || null;
}

export abstract class BaseService<
  T extends { id: string },
  TCreate = Omit<T, "id" | "createdAt" | "updatedAt">,
  TUpdate = Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
> {
  protected abstract repository: IRepository<T>;
  protected abstract entityName: string;

  async findAll(options?: QueryOptions): Promise<PaginatedResult<T>> {
    return this.repository.findAll(options);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async create(data: TCreate): Promise<T> {
    const result = await this.repository.create(data as unknown as Omit<T, "id" | "createdAt" | "updatedAt">);
    const eventKey = deriveEventKey(this.entityName, "created");
    if (eventKey) {
      const payload: EntityEventPayload = {
        entityType: this.entityName,
        entityId: result.id,
        action: "created",
        data: result as unknown as Record<string, unknown>,
      };
      eventBus.emit(eventKey, payload);
    }
    return result;
  }

  async update(id: string, data: TUpdate): Promise<T> {
    const old = await this.repository.findById(id);
    const result = await this.repository.update(id, data as unknown as Partial<Omit<T, "id" | "createdAt" | "updatedAt">>);
    const eventKey = deriveEventKey(this.entityName, "updated");
    if (eventKey) {
      const payload: EntityEventPayload = {
        entityType: this.entityName,
        entityId: result.id,
        action: "updated",
        data: result as unknown as Record<string, unknown>,
        oldData: old as unknown as Record<string, unknown> | undefined,
      };
      eventBus.emit(eventKey, payload);
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const old = await this.repository.findById(id);
    await this.repository.delete(id);
    const eventKey = deriveEventKey(this.entityName, "deleted");
    if (eventKey) {
      const payload: EntityEventPayload = {
        entityType: this.entityName,
        entityId: id,
        action: "deleted",
        oldData: old as unknown as Record<string, unknown> | undefined,
      };
      eventBus.emit(eventKey, payload);
    }
  }

  async search(query: string): Promise<T[]> {
    return this.repository.search(query);
  }
}
