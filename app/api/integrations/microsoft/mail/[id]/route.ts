import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";
import { mailUpdateSchema } from "@/lib/validation/microsoft";

function parseMessageId(req: NextRequest): string | null {
  const id = req.nextUrl.pathname.split("/mail/")[1]?.split("/")[0];
  if (!id || !/^[A-Za-z0-9=_-]+$/.test(id)) return null;
  return id;
}

export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = parseMessageId(req);
  if (!id) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  const result = await graphFetchWithTimeout(accessToken, `/me/messages/${id}`);
  return Response.json(result);
});

export const PATCH = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = parseMessageId(req);
  if (!id) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = mailUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid message update", code: "invalid_mail_update" }, { status: 422 });
  }

  const result = await graphFetchWithTimeout(accessToken, `/me/messages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(parsed.data),
  });

  return Response.json(result);
}, { rateLimitAction: "mail:update", entitlement: "outlook_email" });

export const DELETE = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = parseMessageId(req);
  if (!id) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  await graphFetchWithTimeout(accessToken, `/me/messages/${id}`, {
    method: "DELETE",
  });

  return Response.json({ success: true });
});
