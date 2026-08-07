import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";
import { mailDraftSchema, normalizeRecipientsToGraph } from "@/lib/validation/microsoft";

export const GET = withGraphAuth(async (accessToken) => {
  const result = await graphFetchWithTimeout(accessToken, "/me/mailFolders/drafts/messages?$top=50&$orderby=createdDateTime DESC") as { value: unknown[] };
  return Response.json(result);
});

export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const raw = await req.json();
  // Legacy flat-shape recipients are normalized to the Graph shape.
  if (Array.isArray((raw as { toRecipients?: unknown })?.toRecipients)) {
    (raw as { toRecipients: unknown }).toRecipients = normalizeRecipientsToGraph(
      (raw as { toRecipients?: never[] }).toRecipients,
    );
  }
  const parsed = mailDraftSchema.safeParse(raw);

  if (!parsed.success) {
    console.error(
      "[mail/drafts] validation failed:",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | "),
    );
    return Response.json(
      { error: "Draft could not be saved. Check the recipient addresses and try again." },
      { status: 422 },
    );
  }

  const body = {
    subject: parsed.data.subject,
    body: parsed.data.body ? { contentType: parsed.data.body.contentType, content: parsed.data.body.content } : undefined,
    toRecipients: parsed.data.toRecipients,
  };

  const result = await graphFetchWithTimeout(accessToken, "/me/mailFolders/drafts/messages", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return Response.json(result, { status: 201 });
}, { rateLimitAction: "mail:draft", entitlement: "outlook_email" });
