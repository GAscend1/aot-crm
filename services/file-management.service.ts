import { v4 as uuid } from "uuid";
import type { FileItem } from "@/types/common";

class FileManagementService {
  async upload(
    file: File,
    entityType?: string,
    entityId?: string
  ): Promise<FileItem> {
    const type = this.getFileType(file.type);
    const url = URL.createObjectURL(file);

    const item: FileItem = {
      id: uuid(),
      name: file.name,
      type,
      mimeType: file.type,
      size: file.size,
      url,
      thumbnailUrl: type === "image" ? url : undefined,
      uploadedBy: "Current User",
      uploadedAt: new Date().toISOString(),
      entityType,
      entityId,
    };

    const stored = await this.getAll();
    stored.push(item);
    this.saveAll(stored);

    return item;
  }

  async uploadMultiple(
    files: File[],
    entityType?: string,
    entityId?: string
  ): Promise<FileItem[]> {
    return Promise.all(files.map((f) => this.upload(f, entityType, entityId)));
  }

  async delete(id: string): Promise<void> {
    const items = (await this.getAll()).filter((i) => i.id !== id);
    this.saveAll(items);
  }

  async getById(id: string): Promise<FileItem | null> {
    const items = await this.getAll();
    return items.find((i) => i.id === id) || null;
  }

  async getByEntity(entityType: string, entityId: string): Promise<FileItem[]> {
    const items = await this.getAll();
    return items.filter(
      (i) => i.entityType === entityType && i.entityId === entityId
    );
  }

  async getAll(): Promise<FileItem[]> {
    try {
      return JSON.parse(localStorage.getItem("crm-files") || "[]");
    } catch {
      return [];
    }
  }

  async replace(id: string, file: File): Promise<FileItem> {
    const items = await this.getAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("File not found");

    const type = this.getFileType(file.type);
    const url = URL.createObjectURL(file);

    items[idx] = {
      ...items[idx],
      name: file.name,
      type,
      mimeType: file.type,
      size: file.size,
      url,
      thumbnailUrl: type === "image" ? url : undefined,
    };
    this.saveAll(items);
    return items[idx];
  }

  async getDownloadUrl(id: string): Promise<string> {
    const item = await this.getById(id);
    if (!item) throw new Error("File not found");
    return item.url;
  }

  private getFileType(mimeType: string): FileItem["type"] {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (
      mimeType.includes("word") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("presentation") ||
      mimeType.includes("document")
    ) {
      return "office";
    }
    return "other";
  }

  private saveAll(items: FileItem[]): void {
    localStorage.setItem("crm-files", JSON.stringify(items));
  }
}

export const fileManagementService = new FileManagementService();
