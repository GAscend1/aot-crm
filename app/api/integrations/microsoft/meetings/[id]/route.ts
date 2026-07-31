import { NextRequest } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../../with-graph-auth";

export const DELETE = withGraphAuth(async (accessToken, req: NextRequest) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  if (!id) {
    return Response.json({ error: "Meeting id is required" }, { status: 422 });
  }
  await graphFetchWithTimeout(accessToken, `/me/onlineMeetings/${id}`, {
    method: "DELETE",
  });
  return Response.json({ success: true });
});
