import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../../with-graph-auth";
import { mailForwardSchema, messageIdSchema, normalizeRecipientsToGraph } from "@/lib/validation/microsoft";

export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/mail/")[1]?.split("/forward")[0];
  const idCheck = messageIdSchema.safeParse(id);
  if (!idCheck.success) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (raw && typeof raw.message === "object" && Array.isArray((raw.message as { toRecipients?: unknown }).toRecipients)) {
    (raw.message as { toRecipients: unknown }).toRecipients = normalizeRecipientsToGraph(
      (raw.message as { toRecipients?: never[] }).toRecipients,
    );
  }
  const parsed = mailForwardSchema.safeParse(raw ?? {});

  if (!parsed.success) {
    console.error(
      "[mail/forward] validation failed:",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | "),
    );
    return Response.json(
      { error: "Message could not be forwarded. Check the recipients and try again." },
      { status: 422 },
    );
  }

  await graphFetchWithTimeout(accessToken, `/me/messages/${id}/forward`, {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  return Response.json({ success: true });
}, { rateLimitAction: "mail:forward", entitlement: "outlook_email" });
