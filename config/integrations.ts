export const integrations = {
  dataSource: (process.env.NEXT_PUBLIC_DATA_SOURCE || "sql") as "mock" | "sql",
  storageProvider: (process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "supabase") as "local" | "supabase" | "azure",
  useAzureBlobStorage: process.env.NEXT_PUBLIC_USE_AZURE_BLOB === "true",
  // Connection state is detected at runtime (services/integration-gate.ts), not
  // configured by hand. MICROSOFT_GRAPH_MODE is a supported legacy toggle:
  // "live" | "off" (anything else = "off"). The fake "pending" value is gone.
  // NEXT_PUBLIC_USE_MICROSOFT_GRAPH mirrors the server flag so client-side
  // components (Teams/Zoom dialogs, service gates) see the real value — the
  // server-only USE_MICROSOFT_GRAPH is undefined in browser bundles and made
  // every client-side gate think the integration was off.
  useMicrosoftGraph:
    process.env.USE_MICROSOFT_GRAPH === "true" ||
    process.env.NEXT_PUBLIC_USE_MICROSOFT_GRAPH === "true",
  useZoom: process.env.NEXT_PUBLIC_USE_ZOOM === "true",
  enableAuditLog: true,
  enableGlobalSearch: true,
  enableNotifications: true,
};
