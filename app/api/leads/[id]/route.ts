import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, apiError, zodValidationError } from "@/lib/server/api";
import { logAudit, createActivity, leadDisplayName } from "@/lib/server/records";
import { leadUpdateSchema } from "@/lib/validation/entities";
import type { Prisma } from "@/generated/prisma/client";
import { leadToUI, uiStatusToDb, dbStatusToUi } from "../route";
import type { UILead } from "../route";
export const dynamic = "force-dynamic";

type LeadWithOwner = Prisma.LeadGetPayload<{ include: { assignedTo: true } }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { assignedTo: true },
    });
    if (!lead) return notFound("Lead not found");
    return NextResponse.json(leadToUI(lead));
  } catch (err) {
    logServerError(`GET /api/leads/${id}`, err);
    return serverError("Failed to fetch lead");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    let parsed;
    try {
      parsed = leadUpdateSchema.parse(body);
    } catch (err) {
      return zodValidationError(err, "LEAD_UPDATE_FAILED", "The lead could not be updated.");
    }
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return notFound("Lead not found");

    const data: Prisma.LeadUpdateInput = {};
    const changes: string[] = [];

    if (parsed.title !== undefined) data.title = String(parsed.title);
    if (parsed.firstName !== undefined) data.firstName = String(parsed.firstName);
    if (parsed.lastName !== undefined) data.lastName = String(parsed.lastName);
    if (parsed.contactName !== undefined) {
      const parts = String(parsed.contactName).split(" ");
      data.firstName = parts[0] || "Unknown";
      data.lastName = parts.slice(1).join(" ") || "";
      const beforeName = `${existing.firstName} ${existing.lastName}`.trim();
      const afterName = String(parsed.contactName).trim();
      if (beforeName !== afterName) changes.push(`contact name from "${beforeName}" to "${afterName}"`);
    }
    if (parsed.email !== undefined) {
      data.email = parsed.email ? String(parsed.email) : null;
      const before = existing.email ?? "";
      const after = String(parsed.email ?? "");
      if (before !== after) changes.push(`email${before ? ` from "${before}"` : ""} to "${after || "—"}"`);
    }
    if (parsed.phone !== undefined) {
      data.phone = parsed.phone ? String(parsed.phone) : null;
      const before = existing.phone ?? "";
      const after = String(parsed.phone ?? "");
      if (before !== after) changes.push(`phone${before ? ` from "${before}"` : ""} to "${after || "—"}"`);
    }
    if (parsed.company !== undefined) {
      data.companyName = parsed.company ? String(parsed.company) : null;
      const before = existing.companyName ?? "";
      const after = String(parsed.company ?? "");
      if (before !== after) changes.push(`company${before ? ` from "${before}"` : ""} to "${after || "—"}"`);
    }
    if (parsed.source !== undefined) {
      data.source = parsed.source ? String(parsed.source) : null;
      const before = existing.source ?? "";
      const after = String(parsed.source ?? "");
      if (before !== after) changes.push(`source from "${before || "—"}" to "${after || "—"}"`);
    }
    if (parsed.status !== undefined) {
      const next = uiStatusToDb(String(parsed.status));
      data.status = next;
      if (existing.status !== next) {
        changes.push(`status from "${dbStatusToUi(existing.status)}" to "${dbStatusToUi(next)}"`);
      }
    }
    if (parsed.score !== undefined) {
      data.score = parsed.score;
      const before = existing.score;
      const after = parsed.score;
      if (before !== after) changes.push(`score from "${before}" to "${after}"`);
    }
    if (parsed.probability !== undefined) {
      data.probability = parsed.probability;
      const before = existing.probability;
      const after = parsed.probability;
      if (before !== after) changes.push(`probability from "${before}%" to "${after}%"`);
    }
    if (parsed.expectedRevenue !== undefined) {
      data.expectedRevenue = parsed.expectedRevenue;
      const before = existing.expectedRevenue;
      const after = parsed.expectedRevenue;
      if (before !== after) changes.push(`expected revenue from "${before}" to "${after}"`);
    }
    if (parsed.expectedCloseDate !== undefined) {
      data.expectedCloseDate = parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null;
      const before = existing.expectedCloseDate?.toISOString().slice(0, 10) ?? "";
      const after = parsed.expectedCloseDate ? String(parsed.expectedCloseDate).slice(0, 10) : "";
      if (before !== after) changes.push(`expected close date${before ? ` from "${before}"` : ""} to "${after || "—"}"`);
    }
    if (parsed.notes !== undefined) {
      data.notes = parsed.notes ? String(parsed.notes) : null;
      const before = existing.notes ?? "";
      const after = String(parsed.notes ?? "");
      if (before !== after) changes.push("notes updated");
    }
    if (parsed.ownerId !== undefined) {
      const beforeOwnerId = existing.assignedToId ?? "";
      const afterOwnerId = parsed.ownerId ?? null;
      if (beforeOwnerId !== afterOwnerId) {
        data.assignedTo = parsed.ownerId ? { connect: { id: parsed.ownerId } } : { disconnect: true };
        changes.push("owner changed");
      }
    }

    if (Object.keys(data).length === 0) {
      const current = await prisma.lead.findUnique({
        where: { id },
        include: { assignedTo: true },
      });
      return NextResponse.json(leadToUI(current!));
    }

    const updated = await prisma.lead.update({
      where: { id },
      data,
      include: { assignedTo: true },
    });

    if (changes.length > 0) {
      const changeSummary = changes.join(", ");
      await logAudit({
        entityType: "lead",
        entityId: id,
        action: "lead.updated",
        description: changeSummary,
        userId: user.id,
        before: { ...existing } as Record<string, unknown>,
        after: { ...updated } as Record<string, unknown>,
      });
      await createActivity({
        type: "Note",
        subject: "Lead updated",
        description: changeSummary,
        status: "Completed",
        leadId: id,
      });
    }

    return NextResponse.json(leadToUI(updated));
  } catch (err) {
    logServerError(`PATCH /api/leads/${id}`, err);
    return apiError(500, "LEAD_UPDATE_FAILED", "The lead could not be updated.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return notFound("Lead not found");
    // Archive (soft delete): Leads are referenced by activities, documents,
    // quotes, invoices, reminders, and calendar events. Archiving preserves
    // conversion history and related data.
    await prisma.lead.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await logAudit({
      entityType: "lead",
      entityId: id,
      action: "lead.archived",
      description: `Lead "${leadDisplayName(existing)}" archived`,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logServerError(`DELETE /api/leads/${id}`, err);
    return apiError(500, "LEAD_DELETE_FAILED", "The lead could not be deleted.");
  }
}

export type { UILead, LeadWithOwner };
