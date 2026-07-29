export const integrations = {
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE || "mock") as "mock" | "sql",
  useAzureBlobStorage: process.env.NEXT_PUBLIC_USE_AZURE_BLOB === "true",
  useZoom: process.env.NEXT_PUBLIC_USE_ZOOM === "true",
  enableAuditLog: true,
  enableGlobalSearch: true,
  enableNotifications: true,
};
