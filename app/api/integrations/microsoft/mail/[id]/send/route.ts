import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../../with-graph-auth";
import { messageIdSchema } from "@/lib/validation/microsoft";

/**
 * Send an existing draft via Microsoft Graph (`/me/messages/{id}/send`).
 * Graph returns 202 Accepted on success — we only report success when Graph
 * confirms it; nothing is ever faked client-side.
 */
export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/mail/")[1]?.split("/send")[0];
  const idCheck = messageIdSchema.safeParse(id);
  if (!idCheck.success) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  await graphFetchWithTimeout(accessToken, `/me/messages/${id}/send`, {
    method: "POST",
  });

  return Response.json({ success: true });
}, { rateLimitAction: "mail:send", entitlement: "outlook_email" });
