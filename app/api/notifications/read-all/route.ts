import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError("POST /api/notifications/read-all", err);
    return serverError("Failed to mark notifications as read");
  }
}
