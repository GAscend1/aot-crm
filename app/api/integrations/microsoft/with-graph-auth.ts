import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGraphToken, graphFetch, graphFetchBuffer, GraphServerError } from "@/services/graph-server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/entitlements";
import { getSubscription, isPlatformOwner } from "@/lib/server/tenant";

const GRAPH_TIMEOUT_MS = 15_000;
const MAX_REQUEST_BODY_BYTES = 512_000;

export type GraphRouteHandler = (
  accessToken: string,
  req: NextRequest,
) => Promise<Response>;

function getAppOrigin(): string {
  // Production base URL precedence: AUTH_URL (Auth.js v5) > NEXTAUTH_URL
  // (legacy) > Vercel > Azure App Service default hostname > localhost.
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.WEBSITE_HOSTNAME) return `https://${process.env.WEBSITE_HOSTNAME}`;
  return "http://localhost:3000";
}

function rejectCrossOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const allowed = getAppOrigin();
  try {
    const o = new URL(origin);
    const a = new URL(allowed);
    if (o.origin === a.origin) return null;
  } catch {
    return NextResponse.json({ error: "Invalid Origin header" }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Cross-origin state-changing request rejected" },
    { status: 403 },
  );
}

function checkRequestBodySize(req: NextRequest): NextResponse | null {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "DELETE") {
    return null;
  }
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const bytes = parseInt(contentLength, 10);
    if (!isNaN(bytes) && bytes > MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        { error: `Request body exceeds maximum size of ${MAX_REQUEST_BODY_BYTES} bytes` },
        { status: 413 },
      );
    }
  }
  return null;
}

const SUPPORTED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

function rejectUnsupportedMethod(req: NextRequest): NextResponse | null {
  if (!SUPPORTED_METHODS.has(req.method)) {
    return NextResponse.json(
      { error: `Method ${req.method} not supported` },
      { status: 405 },
    );
  }
  return null;
}

export function withGraphAuth(
  handler: GraphRouteHandler,
  options?: { rateLimitAction?: string; entitlement?: string },
) {
  return async (req: NextRequest) => {
    if (process.env.USE_MICROSOFT_GRAPH !== "true") {
      return NextResponse.json(
        {
          error: "Microsoft Graph is not enabled. Set USE_MICROSOFT_GRAPH=true to enable.",
          code: "graph_not_enabled",
        },
        { status: 503 },
      );
    }

    try {
      const methodCheck = rejectUnsupportedMethod(req);
      if (methodCheck) return methodCheck;

      const session = await auth();
      if (!session?.user?.email) {
        return NextResponse.json(
          {
            error: "Authentication required. Sign in with Microsoft Entra ID.",
            code: "no_token",
          },
          { status: 401 },
        );
      }

      // Server-side feature entitlement enforcement. The Graph integration
      // routes require the plan to grant the feature — e.g. outlook_email for
      // mail, calendar_sync for calendar, teams for meetings. Fails closed: a
      // session without a matching CRM user row is treated as not entitled.
      // Verified AOT Platform Owners bypass the plan matrix (all implemented
      // features allowed) but never bypass the technical provider state — if
      // Teams itself fails, Teams is still reported unavailable.
      if (options?.entitlement) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { organizationId: true, role: true, email: true },
        });
        const ownerBypass =
          !!user && isPlatformOwner(user, session.user.tenantId ?? null);
        const subscription =
          !ownerBypass && user ? await getSubscription(user.organizationId) : null;
        if (
          !ownerBypass &&
          (!subscription || !canUseFeature(subscription.planCode, options.entitlement))
        ) {
          return NextResponse.json(
            {
              error: `${options.entitlement.replaceAll("_", " ")} is not included in your current plan. Upgrade to unlock it.`,
              code: "FEATURE_NOT_ENTITLED",
            },
            { status: 403 },
          );
        }
      }

      if (req.method !== "GET") {
        const originCheck = rejectCrossOrigin(req);
        if (originCheck) return originCheck;

        const sizeCheck = checkRequestBodySize(req);
        if (sizeCheck) return sizeCheck;

        const contentType = req.headers.get("content-type") || "";
        if (contentType && !contentType.includes("application/json") && !contentType.includes("multipart/form-data")) {
          return NextResponse.json(
            { error: "Content-Type must be application/json" },
            { status: 415 },
          );
        }

        if (options?.rateLimitAction) {
          const rateCheck = checkRateLimit(options.rateLimitAction, session.user.email);
          if (!rateCheck.allowed) {
            return rateLimitResponse(rateCheck.retryAfter);
          }
        }
      }

      const accessToken = await getGraphToken(req);
      return await handler(accessToken, req);
    } catch (err) {
      console.error("[microsoft-graph] request failed:", (err as Error)?.name);

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
  };
}

export async function graphFetchWithTimeout(accessToken: string, path: string, options?: RequestInit): Promise<unknown> {
  return graphFetch(accessToken, path, {
    ...options,
    signal: AbortSignal.timeout(GRAPH_TIMEOUT_MS),
  });
}

export async function graphFetchBufferWithTimeout(accessToken: string, path: string): Promise<ArrayBuffer> {
  return graphFetchBuffer(accessToken, path, {
    signal: AbortSignal.timeout(GRAPH_TIMEOUT_MS),
  });
}
