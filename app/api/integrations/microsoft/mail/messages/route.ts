import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";

export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "inbox";
  const top = Math.min(50, Math.max(1, parseInt(searchParams.get("$top") || "25", 10) || 25));
  const skip = Math.max(0, parseInt(searchParams.get("$skip") || "0", 10) || 0);
  const orderby = searchParams.get("$orderby") || "receivedDateTime DESC";

  const allowedFolders = ["inbox", "sentItems", "drafts", "deletedItems", "archive"];
  const safeFolder = allowedFolders.includes(folder) ? folder : "inbox";

  // $skip-based paging keeps the mailbox bounded (never a full download) and
  // avoids exposing opaque @odata.nextLink tokens to the browser.
  const graphPath = `/me/mailFolders/${safeFolder}/messages?$top=${encodeURIComponent(top)}&$skip=${encodeURIComponent(skip)}&$orderby=${encodeURIComponent(orderby)}`;

  const result = await graphFetchWithTimeout(accessToken, graphPath) as { value: unknown[] };
  return Response.json(result);
});
