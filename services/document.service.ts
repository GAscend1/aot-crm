import { BaseService } from "./base/BaseService";
import { MockRepository } from "@/repositories/mock/MockRepository";

export type DocumentCategory =
  | "Contract"
  | "Proposal"
  | "Report"
  | "Invoice"
  | "Marketing"
  | "Other";

export type DocumentType =
  | "PDF"
  | "DOCX"
  | "XLSX"
  | "PPTX"
  | "Image"
  | "Other";

export type DocumentStatus = "Active" | "Archived";

interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  type: DocumentType;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  tags: string[];
  version: string;
  description: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export class DocumentService extends BaseService<Document> {
  protected repository: MockRepository<Document>;

  constructor(initialData: Document[] = []) {
    super();
    this.repository = new MockRepository<Document>(initialData);
  }
}

export type { Document };
