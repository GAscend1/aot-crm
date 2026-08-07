import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";
import { mailSendSchema, normalizeRecipientsToGraph } from "@/lib/validation/microsoft";

const SAFE_VALIDATION_MESSAGE =
  "Your message could not be sent. Check the recipients, subject, and message content, then try again.";

export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") {
    return Response.json({ error: SAFE_VALIDATION_MESSAGE }, { status: 422 });
  }

  // Safety net: legacy clients may post flat `{ name, email }` recipients
  // instead of the Graph `{ emailAddress: { address, name } }` shape.
  // Normalize before validation so a shape mismatch can never crash sends.
  const message = (raw.message ?? raw) as Record<string, unknown>;
  if (message && Array.isArray(message.toRecipients)) {
    message.toRecipients = normalizeRecipientsToGraph(message.toRecipients as never);
  }
  if (message && Array.isArray(message.ccRecipients)) {
    message.ccRecipients = normalizeRecipientsToGraph(message.ccRecipients as never);
  }
  if (message && Array.isArray(message.bccRecipients)) {
    message.bccRecipients = normalizeRecipientsToGraph(message.bccRecipients as never);
  }
  if (Array.isArray(raw.toRecipients) && !raw.message) {
    raw.message = message;
    raw.saveToSentItems = true;
  }

  const parsed = mailSendSchema.safeParse(raw);

  if (!parsed.success) {
    // Never echo raw validation detail to the browser — log it server-side.
    console.error(
      "[mail/send] validation failed:",
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | "),
    );
    return Response.json({ error: SAFE_VALIDATION_MESSAGE }, { status: 422 });
  }

  await graphFetchWithTimeout(accessToken, "/me/sendMail", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  return Response.json({ success: true });
}, { rateLimitAction: "mail:send", entitlement: "outlook_email" });
