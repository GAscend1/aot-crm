import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";
import { mailSendSchema } from "@/lib/validation/microsoft";

export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const raw = await req.json();
  const parsed = mailSendSchema.safeParse(raw);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      { error: first?.message || "Invalid request body" },
      { status: 422 },
    );
  }

  await graphFetchWithTimeout(accessToken, "/me/sendMail", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  return Response.json({ success: true });
}, { rateLimitAction: "mail:send" });
