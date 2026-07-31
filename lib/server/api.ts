import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";
import type { Session } from "next-auth";
import { UserRole } from "@/config/roles";

export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function badRequest(message = "Invalid request"): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function serverError(message = "Internal server error"): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function logServerError(where: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`${where}:`, msg);
}

/**
 * Returns the signed-in CRM User record (created/updated on first login) or null.
 */
export async function getCrmUser(): Promise<User | null> {
  const session = (await auth()) as Session | null;
  if (!session?.user?.email) return null;
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined,
      lastLogin: new Date(),
    },
    create: {
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      lastLogin: new Date(),
    },
  });
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCrmUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export function hasRole(user: User, roles: UserRole[]): boolean {
  return roles.includes(user.role as UserRole);
}

export function isAdmin(user: User): boolean {
  return hasRole(user, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
}

export function isReportsManager(user: User): boolean {
  return hasRole(user, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SALES_MANAGER]);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
