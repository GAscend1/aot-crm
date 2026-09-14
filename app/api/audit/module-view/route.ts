import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

/**
 * Record a MODULE_VIEW audit event. Called by the client when the user
 * navigates to a new module/page. Throttled client-side to avoid excessive
 * events — only fires on actual module transitions, not every render.
 *
 * SECURITY: Organization-scoped via getCrmUser(). No cross-tenant data possible.
 */
export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json().catch(() => ({}));
    const moduleName = String(body.module ?? "").trim();
    const requestPath = String(body.path ?? "").trim();

    if (!moduleName) {
      return NextResponse.json({ error: "module is required" }, { status: 422 });
    }

    // Throttle: skip if the same module was viewed within the last 60 seconds
    const recentView = await prisma.auditLog.findFirst({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
        action: "MODULE_VIEW",
        entityType: moduleName,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
      select: { id: true },
    });

    if (recentView) {
      return NextResponse.json({ throttled: true });
    }

    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        entityType: moduleName,
        entityId: "",
        action: "MODULE_VIEW",
        description: requestPath ? `Opened ${moduleName} (${requestPath})` : `Opened ${moduleName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError("POST /api/audit/module-view", err);
    return serverError("Failed to record module view");
  }
}
