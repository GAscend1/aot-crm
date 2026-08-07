import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../with-graph-auth";

export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const top = searchParams.get("$top") || "50";
  const filter = searchParams.get("$filter") || "";

  let graphPath = `/me/onlineMeetings?$top=${encodeURIComponent(top)}&$orderby=startDateTime ASC`;
  if (filter) graphPath += `&$filter=${encodeURIComponent(filter)}`;

  const result = await graphFetchWithTimeout(accessToken, graphPath) as { value: unknown[] };
  return Response.json(result);
});

export const POST = withGraphAuth(async (accessToken, req: NextRequest) => {
  const raw = await req.json();
  const subject = String(raw.subject ?? "");
  if (!subject.trim()) {
    return Response.json({ error: "Subject is required" }, { status: 422 });
  }

  const body: Record<string, unknown> = {
    subject,
    startDateTime: String(raw.start ?? raw.startDateTime ?? ""),
    endDateTime: String(raw.end ?? raw.endDateTime ?? ""),
  };

  if (raw.participants && Array.isArray(raw.participants) && raw.participants.length > 0) {
    body.participants = raw.participants.map((p: { name?: string; email?: string }) => ({
      upn: p.email || p.name || "",
      role: "presenter",
    }));
  }

  const result = await graphFetchWithTimeout(accessToken, "/me/onlineMeetings", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return Response.json(result, { status: 201 });
}, { rateLimitAction: "meetings:create", entitlement: "teams" });
