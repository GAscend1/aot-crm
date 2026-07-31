import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, forbidden, serverError, logServerError, notFound, isAdmin } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { adminUserSchema } from "@/lib/validation/entities";
import { adminUserToUI } from "../route";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  const { id } = await params;
  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return notFound("User not found");
    return NextResponse.json(adminUserToUI(target));
  } catch (err) {
    logServerError(`GET /api/admin/users/${id}`, err);
    return serverError("Failed to fetch user");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = adminUserSchema.partial().parse(body);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFound("User not found");

    const data: Partial<Pick<User, "name" | "email" | "role" | "department" | "team" | "status">> = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.email !== undefined) data.email = parsed.email;
    if (parsed.role !== undefined) data.role = parsed.role;
    if (parsed.department !== undefined) data.department = parsed.department ?? null;
    if (parsed.team !== undefined) data.team = parsed.team ?? null;
    if (parsed.status !== undefined) data.status = parsed.status;

    const updated = await prisma.user.update({ where: { id }, data });

    await logAudit({
      entityType: "user",
      entityId: id,
      action: "admin.user.updated",
      description: `User "${updated.name ?? updated.email}" updated`,
      userId: user.id,
    });

    return NextResponse.json(adminUserToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/admin/users/${id}`, err);
    return serverError("Failed to update user");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  const { id } = await params;
  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFound("User not found");
    await prisma.user.delete({ where: { id } });
    await logAudit({
      entityType: "user",
      entityId: id,
      action: "admin.user.deleted",
      description: `User "${existing.name ?? existing.email}" deleted`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/admin/users/${id}`, err);
    return serverError("Failed to delete user");
  }
}
