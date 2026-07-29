import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGraphToken, graphFetchBuffer, GraphServerError } from "@/services/graph-server";
export async function GET(req: NextRequest) {
  if (process.env.USE_MICROSOFT_GRAPH !== "true") {
    return NextResponse.json(
      { error: "Microsoft Graph is not enabled. Set USE_MICROSOFT_GRAPH=true to enable." },
      { status: 503 },
    );
  }

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required. Sign in with Microsoft Entra ID." },
        { status: 401 },
      );
    }

    const accessToken = await getGraphToken(req);
    const buffer = await graphFetchBuffer(accessToken, "/me/photo/$value", {
      signal: AbortSignal.timeout(15_000),
    });
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    console.error("[microsoft-photo] request failed:", (err as Error)?.name, (err as Error)?.message);

    if (err instanceof GraphServerError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
