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

export interface Document {
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
}