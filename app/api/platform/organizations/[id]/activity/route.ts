import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requirePlatformOwner,
  forbidden,
  serverError,
  logServerError,
} from "@/lib/server/api";
export const dynamic = "force-dynamic";

export interface OrgActivityEntry {
  id: string;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string | null;
}

/**
 * Platform Owner — Organization Activity Feed.
 * Returns paginated AuditLog entries for a specific organization.
 * Restricted to platform-owner accounts only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await requirePlatformOwner();
  if (!owner) return forbidden();

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50")));
  const moduleFilter = searchParams.get("module") ?? undefined;
  const actionFilter = searchParams.get("action") ?? undefined;
  const userIdFilter = searchParams.get("userId") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  try {
    // Verify the organization exists
    const org = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = { organizationId: id };

    // Module filter: map module names to entityType patterns
    if (moduleFilter) {
      const moduleMap: Record<string, string[]> = {
        dashboard: ["dashboard"],
        customers: ["customer"],
        companies: ["company"],
        contacts: ["contact"],
        leads: ["lead"],
        opportunities: ["opportunity"],
        activities: ["activity"],
        calendar: ["calendar", "calendarEvent"],
        email: ["email", "activity"],
        tickets: ["ticket"],
        documents: ["document"],
        quotes: ["quote"],
        invoices: ["invoice"],
        reports: ["report"],
        administration: ["admin", "organization", "subscription", "user"],
        profile: ["user", "profile"],
        auth: ["auth", "session"],
      };
      const entityTypes = moduleMap[moduleFilter.toLowerCase()];
      if (entityTypes && entityTypes.length > 0) {
        where.entityType = { in: entityTypes };
      }
    }

    if (actionFilter) {
      where.action = { contains: actionFilter, mode: "insensitive" };
    }

    if (userIdFilter) {
      where.userId = userIdFilter;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const data: OrgActivityEntry[] = entries.map((e) => ({
      id: e.id,
      createdAt: e.createdAt.toISOString(),
      userEmail: e.user?.email ?? null,
      userName: e.user?.name ?? null,
      module: inferModule(e.entityType, e.action),
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      description: e.description,
    }));

    // Get summary stats
    const [totalActivities, userCount] = await Promise.all([
      prisma.auditLog.count({ where: { organizationId: id } }),
      prisma.user.count({ where: { organizationId: id } }),
    ]);

    // Get last activity
    const lastActivity = await prisma.auditLog.findFirst({
      where: { organizationId: id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // Get subscription info
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: id },
      select: {
        planCode: true,
        status: true,
        trialStartedAt: true,
        trialEndsAt: true,
      },
    });

    // Get org creation date
    const orgFull = await prisma.organization.findUnique({
      where: { id },
      select: { createdAt: true },
    });

    // Get unique users who have activity
    const activeUserIds = await prisma.auditLog.findMany({
      where: { organizationId: id, userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    });

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        organizationId: id,
        organizationName: org.name,
        totalActivities,
        activeUsers: activeUserIds.length,
        totalUsers: userCount,
        lastActivityAt: lastActivity?.createdAt?.toISOString() ?? null,
        createdAt: orgFull?.createdAt?.toISOString() ?? null,
        planCode: subscription?.planCode ?? null,
        subscriptionStatus: subscription?.status ?? null,
        trialStartedAt: subscription?.trialStartedAt?.toISOString() ?? null,
        trialEndsAt: subscription?.trialEndsAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    logServerError("GET /api/platform/organizations/[id]/activity", err);
    return serverError("Failed to fetch organization activity");
  }
}

/**
 * Infer a human-readable module name from the entityType and action.
 */
function inferModule(entityType: string, action: string): string {
  const et = entityType.toLowerCase();
  if (et.includes("lead")) return "Leads";
  if (et.includes("opportunity")) return "Opportunities";
  if (et.includes("customer")) return "Customers";
  if (et.includes("company")) return "Companies";
  if (et.includes("contact")) return "Contacts";
  if (et.includes("activity")) return "Activities";
  if (et.includes("ticket")) return "Tickets";
  if (et.includes("document")) return "Documents";
  if (et.includes("quote")) return "Quotes";
  if (et.includes("invoice")) return "Invoices";
  if (et.includes("calendar") || et.includes("event")) return "Calendar";
  if (et.includes("email") || action.includes("email")) return "Email";
  if (et.includes("report")) return "Reports";
  if (et.includes("user") || et.includes("admin")) return "Administration";
  if (et.includes("subscription") || et.includes("plan")) return "Administration";
  if (et.includes("organization")) return "Administration";
  if (et.includes("onboarding")) return "Onboarding";
  if (action.includes("auth") || action.includes("session")) return "Auth";
  if (action.includes("login") || action.includes("sign")) return "Auth";
  return entityType || "System";
}
