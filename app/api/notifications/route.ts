import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import type { NotificationType } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

const typeToUi: Record<NotificationType, "info" | "warning" | "success" | "error"> = {
  Info: "info",
  Warning: "warning",
  Success: "success",
  Error: "error",
};

export async function GET(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    const data = notifications.map((n) => ({
      id: n.id,
      type: typeToUi[n.type],
      title: n.title,
      message: n.message ?? "",
      read: n.read,
      category: n.entityType ?? "crm",
      entityType: n.entityType ?? undefined,
      entityId: n.entityId ?? undefined,
      actionLink: n.actionLink ?? undefined,
      timestamp: n.createdAt.toISOString(),
    }));
    return NextResponse.json({ data, unreadCount });
  } catch (err) {
    logServerError("GET /api/notifications", err);
    return serverError("Failed to fetch notifications");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const type = (body?.type as NotificationType | undefined) ?? "Info";
    const title = String(body?.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const created = await prisma.notification.create({
      data: {
        userId: user.id,
        type: ["Info", "Warning", "Success", "Error"].includes(type) ? type : "Info",
        title,
        message: body?.message ? String(body.message) : undefined,
        entityType: body?.entityType ? String(body.entityType) : undefined,
        entityId: body?.entityId ? String(body.entityId) : undefined,
        actionLink: body?.actionLink ? String(body.actionLink) : undefined,
      },
    });
    return NextResponse.json(
      {
        id: created.id,
        type: typeToUi[created.type],
        title: created.title,
        message: created.message ?? "",
        read: created.read,
        entityType: created.entityType ?? undefined,
        entityId: created.entityId ?? undefined,
        actionLink: created.actionLink ?? undefined,
        timestamp: created.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    logServerError("POST /api/notifications", err);
    return serverError("Failed to create notification");
  }
}

export async function DELETE() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError("DELETE /api/notifications", err);
    return serverError("Failed to clear notifications");
  }
}
