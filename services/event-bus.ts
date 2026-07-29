type EventHandler = (payload: unknown) => void;

class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();
  private history = new Map<string, unknown[]>();

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    const history = this.history.get(event);
    if (history) {
      for (const payload of history) {
        handler(payload);
      }
    }

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit(event: string, payload: unknown): void {
    if (!this.history.has(event)) {
      this.history.set(event, []);
    }
    this.history.get(event)!.push(payload);
    if (this.history.get(event)!.length > 100) {
      this.history.get(event)!.shift();
    }

    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch {}
    });
  }

  clearHistory(): void {
    this.history.clear();
  }
}

export const eventBus = new EventBus();
