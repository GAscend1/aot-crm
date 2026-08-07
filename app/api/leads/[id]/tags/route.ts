import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit, createActivity, leadDisplayName } from "@/lib/server/records";
import { z } from "zod";
export const dynamic = "force-dynamic";

const tagSchema = z.object({ tag: z.string().min(1) });

async function syncLeadTagNames(leadId: string): Promise<string[]> {
  const links = await prisma.leadTag.findMany({
    where: { leadId },
    include: { tag: { select: { name: true } } },
  });
  const names = links.map((l) => l.tag.name);
  await prisma.lead.update({ where: { id: leadId }, data: { tags: names } });
  return names;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const lead = await prisma.lead.findFirst({ where: { id, organizationId: user.organizationId }, select: { id: true } });
    if (!lead) return notFound("Lead not found");
    const links = await prisma.leadTag.findMany({
      where: { leadId: id },
      include: { tag: true },
      orderBy: { tag: { name: "asc" } },
    });
    return NextResponse.json({
      data: links.map((l) => ({ id: l.tag.id, name: l.tag.name, color: l.tag.color, category: l.tag.category })),
    });
  } catch (err) {
    logServerError(`GET /api/leads/${id}/tags`, err);
    return serverError("Failed to fetch tags");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = tagSchema.parse(body);
    const lead = await prisma.lead.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!lead) return notFound("Lead not found");

    // Tags are org-scoped: unique on (organizationId, name).
    const tagName = parsed.tag.trim();
    const tag = await prisma.tag.upsert({
      where: { organizationId_name: { organizationId: user.organizationId, name: tagName } },
      update: {},
      create: { name: tagName, organizationId: user.organizationId },
    });
    const existing = await prisma.leadTag.findUnique({
      where: { leadId_tagId: { leadId: id, tagId: tag.id } },
    });
    if (!existing) {
      await prisma.leadTag.create({ data: { leadId: id, tagId: tag.id } });
    }
    const names = await syncLeadTagNames(id);

    await logAudit({
      entityType: "lead",
      entityId: id,
      action: "lead.tag_added",
      description: `Tag "${tag.name}" added to lead "${leadDisplayName(lead)}"`,
      userId: user.id,
      organizationId: user.organizationId,
      after: { tag: tag.name },
    });
    await createActivity({
      type: "Note",
      subject: `Tag "${tag.name}" added`,
      status: "Completed",
      leadId: id,
      organizationId: user.organizationId,
    });

    return NextResponse.json({ data: names }, { status: 201 });
  } catch (err) {
    logServerError(`POST /api/leads/${id}/tags`, err);
    return serverError("Failed to add tag");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = tagSchema.parse(body);
    const lead = await prisma.lead.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!lead) return notFound("Lead not found");
    const tag = await prisma.tag.findFirst({ where: { name: parsed.tag.trim(), organizationId: user.organizationId } });
    if (tag) {
      await prisma.leadTag.deleteMany({
        where: { leadId: id, tagId: tag.id },
      });
    }
    const names = await syncLeadTagNames(id);

    await logAudit({
      entityType: "lead",
      entityId: id,
      action: "lead.tag_removed",
      description: `Tag "${parsed.tag}" removed from lead "${leadDisplayName(lead)}"`,
      userId: user.id,
      organizationId: user.organizationId,
      after: { tag: parsed.tag },
    });
    await createActivity({
      type: "Note",
      subject: `Tag "${parsed.tag}" removed`,
      status: "Completed",
      leadId: id,
      organizationId: user.organizationId,
    });

    return NextResponse.json({ data: names });
  } catch (err) {
    logServerError(`DELETE /api/leads/${id}/tags`, err);
    return serverError("Failed to remove tag");
  }
}
