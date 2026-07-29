import { customerService, companyService, contactService, leadService, opportunityService, ticketService, documentService } from "./index";

interface SearchResult {
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
}

class GlobalSearchService {
  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    const searches = await Promise.allSettled([
      this.searchEntities(customerService, "customers", q, "customer"),
      this.searchEntities(companyService, "companies", q, "building"),
      this.searchEntities(contactService, "contacts", q, "contact"),
      this.searchEntities(leadService, "leads", q, "target"),
      this.searchEntities(opportunityService, "opportunities", q, "briefcase"),
      this.searchEntities(ticketService, "tickets", q, "ticket"),
      this.searchEntities(documentService, "documents", q, "file"),
    ]);

    for (const result of searches) {
      if (result.status === "fulfilled") {
        results.push(...result.value);
      }
    }

    return results.slice(0, 20);
  }

  private async searchEntities(
    service: {
      search: (query: string) => Promise<{ id: string; name?: string; title?: string; subject?: string; company?: string; email?: string }[]>;
    },
    entityType: string,
    query: string,
    icon: string
  ): Promise<SearchResult[]> {
    try {
      const items = await service.search(query);
      return items.map((item) => ({
        entityType,
        entityId: item.id,
        title: item.name || item.title || item.subject || "Untitled",
        subtitle: item.company || item.email || entityType.slice(0, -1),
        href: `/${entityType}/${item.id}`,
        icon,
      }));
    } catch {
      return [];
    }
  }
}

export const globalSearchService = new GlobalSearchService();
