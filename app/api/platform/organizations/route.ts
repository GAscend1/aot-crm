import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformOwner, forbidden, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

export interface UIOrganization {
  id: string;
  name: string;
  microsoftTenantId: string | null;
  status: string;
  planCode: string;
  subscriptionStatus: string;
  subscriptionSource: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  memberCount: number;
  userCount: number;
  ownerName: string | null;
  ownerEmail: string | null;
  companyCount: number;
  opportunityCount: number;
  createdById: string | null;
  createdAt: string;
  lastActiveAt: string | null;
}

/**
 * Platform Owner — Organizations. Lists every customer workspace with its
 * Microsoft tenant id, plan, subscription status, trial window, primary
 * contact (owner), member/user counts, record counts, created date and last
 * activity. Restricted to designated AOT platform-owner accounts.
 */
export async function GET() {
  // Verified Entra tid === AOT_PLATFORM_TENANT_ID (centralized server-side guard).
  const owner = await requirePlatformOwner();
  if (!owner) return forbidden();

  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          take: 1,
          select: {
            planCode: true,
            status: true,
            source: true,
            trialStartedAt: true,
            trialEndsAt: true,
            startsAt: true,
            endsAt: true,
          },
        },
        members: {
          include: { user: { select: { name: true, email: true } } },
        },
        users: { select: { lastLogin: true } },
        _count: { select: { users: true, companies: true, opportunities: true } },
      },
    });

    const data: UIOrganization[] = orgs.map((org) => {
      const owner = org.members.find((m) => m.role === "OWNER")?.user;
      const lastActive = org.users
        .map((u) => u.lastLogin?.getTime() ?? 0)
        .reduce((a, b) => Math.max(a, b), 0);
      const sub = org.subscriptions[0];
      return {
        id: org.id,
        name: org.name,
        microsoftTenantId: org.microsoftTenantId,
        status: org.status,
        planCode: sub?.planCode ?? "TRIAL",
        subscriptionStatus: sub?.status ?? "TRIALING",
        subscriptionSource: sub?.source ?? "TRIAL",
        trialStartedAt: sub?.trialStartedAt?.toISOString() ?? null,
        trialEndsAt: sub?.trialEndsAt?.toISOString() ?? null,
        startsAt: sub?.startsAt?.toISOString() ?? null,
        endsAt: sub?.endsAt?.toISOString() ?? null,
        memberCount: org.members.length,
        userCount: org._count.users,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        companyCount: org._count.companies,
        opportunityCount: org._count.opportunities,
        createdById: org.createdById,
        createdAt: org.createdAt.toISOString(),
        lastActiveAt: lastActive ? new Date(lastActive).toISOString() : null,
      };
    });

    return NextResponse.json({ data, total: data.length });
  } catch (err) {
    logServerError("GET /api/platform/organizations", err);
    return serverError("Failed to fetch organizations");
  }
}
