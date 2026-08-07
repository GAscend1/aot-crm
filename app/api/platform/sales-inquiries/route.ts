import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformOwner, forbidden, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

export interface UISalesInquiry {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  companySize: string | null;
  industry: string | null;
  intendedUse: string | null;
  preferredPlan: string | null;
  message: string | null;
  source: string;
  status: string;
  organizationId: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  notes: string | null;
  submittedAt: string;
  organizationName: string | null;
}

/**
 * Platform Owner — all Request Demo / Contact Sales inquiries, newest first.
 * Filter by ?status=PENDING etc. The owner decides next steps; inquiries never
 * auto-create leads or opportunities.
 */
export async function GET(request: NextRequest) {
  // Verified Entra tid === AOT_PLATFORM_TENANT_ID (centralized server-side guard).
  const owner = await requirePlatformOwner();
  if (!owner) return forbidden();

  const status = new URL(request.url).searchParams.get("status");
  const limit = Math.min(500, Math.max(1, Number(new URL(request.url).searchParams.get("limit") || 300)));

  try {
    const inquiries = await prisma.salesInquiry.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: "desc" },
      take: limit,
      include: {
        reviewedBy: { select: { name: true } },
        organization: { select: { name: true } },
      },
    });

    const data: UISalesInquiry[] = inquiries.map((q) => ({
      id: q.id,
      name: q.name,
      email: q.email,
      company: q.company,
      phone: q.phone,
      companySize: q.companySize,
      industry: q.industry,
      intendedUse: q.intendedUse,
      preferredPlan: q.preferredPlan,
      message: q.message,
      source: q.source,
      status: q.status,
      organizationId: q.organizationId,
      reviewedByName: q.reviewedBy?.name ?? null,
      reviewedAt: q.reviewedAt?.toISOString() ?? null,
      notes: q.notes,
      submittedAt: q.submittedAt.toISOString(),
      organizationName: q.organization?.name ?? null,
    }));

    return NextResponse.json({ data, total: data.length });
  } catch (err) {
    logServerError("GET /api/platform/sales-inquiries", err);
    return serverError("Failed to fetch inquiries");
  }
}
