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

/**
 * Structured, user-safe API error. Never includes internal details, secrets,
 * or database credentials — those are logged server-side separately.
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  fieldErrors: Record<string, string> = {}
): NextResponse {
  return NextResponse.json({ success: false, code, message, fieldErrors }, { status });
}

export interface ZodIssueLike {
  path?: (string | number)[];
  message: string;
}

/**
 * Converts a zod validation failure into a structured 400 response with
 * field-level errors the UI can display next to the offending inputs.
 */
export function zodValidationError(
  err: unknown,
  code = "VALIDATION_FAILED",
  fallbackMessage = "Invalid request data"
): NextResponse {
  const fieldErrors: Record<string, string> = {};
  if (err && typeof err === "object" && Array.isArray((err as { errors?: unknown }).errors)) {
    for (const issue of (err as { errors: ZodIssueLike[] }).errors) {
      const key = issue.path?.map(String).join(".") ?? "root";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
  }
  const message = Object.values(fieldErrors)[0] ?? fallbackMessage;
  return apiError(400, code, message, fieldErrors);
}

/** True when the thrown error is a Prisma unique-constraint violation (P2002). */
export function isUniqueConstraint(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
}

/** True when the thrown error is a Prisma "record not found" (P2025). */
export function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2025"
  );
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
