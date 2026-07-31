export const integrations = {
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE || "sql") as "mock" | "sql",
  storageProvider: (process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "supabase") as "local" | "supabase" | "azure",
  useAzureBlobStorage: process.env.NEXT_PUBLIC_USE_AZURE_BLOB === "true",
  microsoftGraphMode: (process.env.MICROSOFT_GRAPH_MODE || "pending") as "active" | "pending",
  useMicrosoftGraph: process.env.USE_MICROSOFT_GRAPH === "true",
  useZoom: process.env.NEXT_PUBLIC_USE_ZOOM === "true",
  enableAuditLog: true,
  enableGlobalSearch: true,
  enableNotifications: true,
};
