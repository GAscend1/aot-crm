import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";
import { mailDraftSchema } from "@/lib/validation/microsoft";

export const GET = withGraphAuth(async (accessToken) => {
  const result = await graphFetchWithTimeout(accessToken, "/me/mailFolders/drafts/messages?$top=50&$orderby=createdDateTime DESC") as { value: unknown[] };
  return Response.json(result);
});

export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const raw = await req.json();
  const parsed = mailDraftSchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      { error: first?.message || "Invalid request body" },
      { status: 422 },
    );
  }

  const body = {
    subject: parsed.data.subject,
    body: parsed.data.body ? { contentType: parsed.data.body.contentType, content: parsed.data.body.content } : undefined,
    toRecipients: parsed.data.toRecipients.map((r) => ({ emailAddress: { address: r.email, name: r.name } })),
  };

  const result = await graphFetchWithTimeout(accessToken, "/me/mailFolders/drafts/messages", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return Response.json(result, { status: 201 });
}, { rateLimitAction: "mail:draft" });
