import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchBufferWithTimeout } from "../../../../../with-graph-auth";
import { messageIdSchema } from "@/lib/validation/microsoft";

function safeFileName(name: string | null): string {
  const fallback = "attachment";
  if (!name) return fallback;
  const safe = name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
  return safe || fallback;
}

/**
 * Stream a single attachment's binary content on demand. Only fetched when the
 * user explicitly downloads — never eagerly. Content-Type is passed through
 * from the caller-provided metadata (never trusted from Graph for execution).
 */
export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const parts = req.nextUrl.pathname.split("/mail/")[1] ?? "";
  const messageMatch = parts.match(/^([^/]+)\/attachments\/([^/]+)\/content$/);
  if (!messageMatch) {
    return Response.json({ error: "Invalid attachment path" }, { status: 422 });
  }
  const [, messageId, attachmentId] = messageMatch;

  const idCheck = messageIdSchema.safeParse(messageId);
  if (!idCheck.success) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  const { searchParams } = new URL(req.url);
  const name = safeFileName(searchParams.get("name"));

  const buffer = await graphFetchBufferWithTimeout(
    accessToken,
    `/me/messages/${messageId}/attachments/${attachmentId}/$value`,
  );

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
});
