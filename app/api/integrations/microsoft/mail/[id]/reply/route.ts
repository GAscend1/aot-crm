import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../../with-graph-auth";
import { mailReplySchema, messageIdSchema } from "@/lib/validation/microsoft";

export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/mail/")[1]?.split("/reply")[0];
  const idCheck = messageIdSchema.safeParse(id);
  if (!idCheck.success) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  const raw = await req.json();
  const parsed = mailReplySchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      { error: first?.message || "Invalid request body" },
      { status: 422 },
    );
  }

  await graphFetchWithTimeout(accessToken, `/me/messages/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ comment: parsed.data.comment }),
  });

  return Response.json({ success: true });
}, { rateLimitAction: "mail:reply" });
