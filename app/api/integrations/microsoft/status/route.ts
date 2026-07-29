import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const isLive = process.env.USE_MICROSOFT_GRAPH === "true";
  return NextResponse.json({
    provider: isLive ? "live" : "mock",
    enabled: isLive,
  });
}
