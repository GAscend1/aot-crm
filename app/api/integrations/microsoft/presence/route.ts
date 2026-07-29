import { withGraphAuth, graphFetchWithTimeout } from "../with-graph-auth";

export const GET = withGraphAuth(async (accessToken) => {
  const presence = await graphFetchWithTimeout(accessToken, "/me/presence") as { availability: string };
  return Response.json({ availability: presence.availability });
});
