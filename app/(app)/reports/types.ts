export type ReportCategory = "Sales" | "Customer" | "Pipeline" | "Activity" | "Financial" | "Custom";

export type ReportType = "Bar Chart" | "Line Chart" | "Pie Chart" | "Table" | "Summary";

export type ReportStatus = "Draft" | "Published" | "Archived";

export interface Report {
  id: string;
  name: string;
  category: ReportCategory;
  type: ReportType;
  description: string;
  createdBy: string;
  createdAt: string;
  lastRun: string;
  status: ReportStatus;
}
