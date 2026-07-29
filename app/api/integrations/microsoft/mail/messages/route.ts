import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";

export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "inbox";
  const top = searchParams.get("$top") || "50";
  const orderby = searchParams.get("$orderby") || "receivedDateTime DESC";

  const allowedFolders = ["inbox", "sentItems", "drafts", "deletedItems", "archive"];
  const safeFolder = allowedFolders.includes(folder) ? folder : "inbox";

  const graphPath = `/me/mailFolders/${safeFolder}/messages?$top=${encodeURIComponent(top)}&$orderby=${encodeURIComponent(orderby)}`;

  const result = await graphFetchWithTimeout(accessToken, graphPath) as { value: unknown[] };
  return Response.json(result);
});
