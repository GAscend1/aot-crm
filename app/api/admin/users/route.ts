import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, forbidden, serverError, logServerError, badRequest, isAdmin } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import { adminUserSchema } from "@/lib/validation/entities";

export type UIAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  team: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
};

export function adminUserToUI(u: User): UIAdminUser {
  return {
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    role: u.role,
    department: u.department ?? "",
    team: u.team ?? "",
    status: u.status,
    lastLogin: u.lastLogin ? u.lastLogin.toISOString() : "",
    createdAt: u.createdAt.toISOString().split("T")[0],
    updatedAt: u.updatedAt.toISOString().split("T")[0],
  };
}

export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ data: users.map(adminUserToUI), total: users.length });
  } catch (err) {
    logServerError("GET /api/admin/users", err);
    return serverError("Failed to fetch users");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  if (!isAdmin(user)) return forbidden();
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = adminUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return badRequest("A user with this email already exists");

    const created = await prisma.user.create({
      data: {
        email: parsed.email,
        name: parsed.name,
        role: parsed.role,
        department: parsed.department,
        team: parsed.team,
        status: parsed.status,
      },
    });

    await logAudit({
      entityType: "user",
      entityId: created.id,
      action: "admin.user.created",
      description: `User "${created.name ?? created.email}" created`,
      userId: user.id,
    });

    return NextResponse.json(adminUserToUI(created), { status: 201 });
  } catch (err) {
    logServerError("POST /api/admin/users", err);
    return serverError("Failed to create user");
  }
}
