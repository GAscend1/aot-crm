import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";

export const GET = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/mail/")[1]?.split("/")[0];
  if (!id) {
    return Response.json({ error: "Message ID is required" }, { status: 400 });
  }

  if (!/^[A-Za-z0-9=_-]+$/.test(id)) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  const result = await graphFetchWithTimeout(accessToken, `/me/messages/${id}`);
  return Response.json(result);
});

export const DELETE = withGraphAuth(async (accessToken, req: NextRequest) => {
  const id = req.nextUrl.pathname.split("/mail/")[1]?.split("/")[0];
  if (!id) {
    return Response.json({ error: "Message ID is required" }, { status: 400 });
  }

  if (!/^[A-Za-z0-9=_-]+$/.test(id)) {
    return Response.json({ error: "Invalid message ID format" }, { status: 422 });
  }

  await graphFetchWithTimeout(accessToken, `/me/messages/${id}`, {
    method: "DELETE",
  });

  return Response.json({ success: true });
});
