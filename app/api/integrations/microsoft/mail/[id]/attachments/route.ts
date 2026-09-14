import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../../with-graph-auth";
import { messageIdSchema } from "@/lib/validation/microsoft";

/**
 * Attachment METADATA for a message (name, contentType, size, id). Content is
 * fetched on demand via /mail/{id}/attachments/{attachmentId}/content — the
 * mailbox is never downloaded eagerly while listing messages.
 */
export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/mail/")[1]?.split("/attachments")[0];
  const idCheck = messageIdSchema.safeParse(id);
  if (!idCheck.success) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  const result = await graphFetchWithTimeout(
    accessToken,
    `/me/messages/${id}/attachments?$select=id,name,contentType,size,isInline`,
  ) as { value?: unknown[] };

  return Response.json({ value: result.value ?? [] });
});
