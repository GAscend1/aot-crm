import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCrmUser,
  unauthorized,
  serverError,
  logServerError,
  badRequest,
} from "@/lib/server/api";
import { UserRole } from "@/config/roles";
export const dynamic = "force-dynamic";

/**
 * Roles a user may self-select during first-time onboarding. Admin/owner roles
 * are deliberately excluded — those are assigned by an existing admin.
 */
const SELF_SELECTABLE_ROLES: UserRole[] = [
  UserRole.SALES_MANAGER,
  UserRole.SALES,
  UserRole.SUPPORT_MANAGER,
  UserRole.SUPPORT,
  UserRole.HR_MANAGER,
  UserRole.HR,
  UserRole.VIEWER,
];

/**
 * Current user's CRM profile (name, email, role, department, team, avatar).
 * This is the CRM-first identity source — independent of Microsoft Graph, so
 * /profile always has data to render even when Graph is down.
 */
export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        department: true,
        team: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }
    return NextResponse.json({ data: profile });
  } catch (err) {
    logServerError("GET /api/users/me", err);
    return serverError("Failed to fetch your profile");
  }
}

/**
 * Updates the current user's own profile. Only `role` is supported for now
 * (first-time onboarding role selection) and it must be from the self-select
 * whitelist — users can never promote themselves to an admin role.
 */
export async function PATCH(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const body = (await request.json().catch(() => ({}))) as { role?: string };
    if (body.role === undefined) return badRequest("Nothing to update");
    if (!SELF_SELECTABLE_ROLES.includes(body.role as UserRole)) {
      return badRequest("That role cannot be self-assigned");
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: body.role },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        department: true,
        team: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    logServerError("PATCH /api/users/me", err);
    return serverError("Failed to update your profile");
  }
}
