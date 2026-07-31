import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    await prisma.notification.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/notifications/${id}`, err);
    return serverError("Failed to delete notification");
  }
}
