import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError, logServerError, badRequest } from "@/lib/server/api";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";

/**
 * Self-service Request Demo / Contact Sales / Talk to Sales.
 *
 * Public — no payment and no account required. Persists as a SalesInquiry the
 * Platform Owner reviews (keep pending / convert to Lead / create Trial
 * workspace / grant demo / resolve). NEVER auto-creates an Opportunity.
 *
 * Only claims a confirmation email if one is actually sent — today we persist
 * and acknowledge the request.
 */
export async function POST(request: NextRequest) {
  // Coarse rate limit for the public form (spam guard).
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = checkRateLimit("inquiry:post", `ip:${ip}`, 10, 60_000);
  if (!limited.allowed) return rateLimitResponse(limited.retryAfter);

  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      company?: string;
      phone?: string;
      companySize?: string;
      industry?: string;
      intendedUse?: string;
      preferredPlan?: string;
      message?: string;
      source?: string;
    };

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!name || name.length < 2) return badRequest("Please provide your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest("Please provide a valid work email.");
    }

    const inquiry = await prisma.salesInquiry.create({
      data: {
        name,
        email,
        company: body.company?.trim() || null,
        phone: body.phone?.trim() || null,
        companySize: body.companySize?.trim() || null,
        industry: body.industry?.trim() || null,
        intendedUse: body.intendedUse?.trim() || null,
        preferredPlan: body.preferredPlan?.trim() || null,
        message: body.message?.trim() || null,
        source: ["WEB", "CONTACT", "BOOK_DEMO", "GET_STARTED", "TRIAL"].includes(
          body.source ?? "",
        )
          ? body.source!
          : "WEB",
      },
    });

    return NextResponse.json(
      {
        data: { id: inquiry.id, submittedAt: inquiry.submittedAt.toISOString() },
        message: "Thanks. Your request has been received.",
      },
      { status: 201 },
    );
  } catch (err) {
    logServerError("POST /api/sales-inquiries", err);
    return serverError("Failed to submit your request");
  }
}
