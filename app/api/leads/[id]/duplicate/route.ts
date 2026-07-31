import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit, createActivity, leadDisplayName } from "@/lib/server/records";
import { leadDuplicateSchema } from "@/lib/validation/entities";
import { leadToUI } from "../../route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = leadDuplicateSchema.parse(body);
    const source = await prisma.lead.findUnique({
      where: { id },
      include: { tagLinks: { include: { tag: true } } },
    });
    if (!source) return notFound("Lead not found");

    const duplicated = await prisma.lead.create({
      data: {
        firstName: source.firstName,
        lastName: source.lastName,
        title: source.title ? `${source.title} (copy)` : source.title,
        email: source.email,
        phone: source.phone,
        companyName: source.companyName,
        source: source.source,
        status: "New",
        assignedToId: source.assignedToId,
        probability: source.probability,
        expectedRevenue: source.expectedRevenue,
        expectedCloseDate: source.expectedCloseDate,
        score: 0,
        notes: source.notes,
        tags: source.tags as unknown as Prisma.InputJsonValue,
        customerId: source.customerId,
        tagLinks: {
          create: source.tagLinks.map((link) => ({ tagId: link.tagId })),
        },
      },
      include: { assignedTo: true },
    });

    if (parsed.includeDocuments) {
      const documents = await prisma.document.findMany({
        where: { leadId: id, status: { not: "Archived" } },
      });
      for (const doc of documents) {
        await prisma.document.create({
          data: {
            name: doc.name,
            type: doc.type,
            mimeType: doc.mimeType,
            size: doc.size,
            checksum: doc.checksum,
            storageProvider: doc.storageProvider,
            category: doc.category,
            description: doc.description,
            tags: doc.tags as unknown as Prisma.InputJsonValue,
            version: doc.version,
            status: doc.status,
            url: doc.url,
            storageKey: doc.storageKey,
            leadId: duplicated.id,
            uploadedById: user.id,
          },
        });
      }
    }

    await logAudit({
      entityType: "lead",
      entityId: duplicated.id,
      action: "lead.duplicated",
      description: `Lead "${leadDisplayName(source)}" duplicated as "${leadDisplayName(duplicated)}"`,
      userId: user.id,
      data: { sourceLeadId: id },
    });
    await logAudit({
      entityType: "lead",
      entityId: id,
      action: "lead.duplicated",
      description: `Lead duplicated into "${leadDisplayName(duplicated)}"`,
      userId: user.id,
      data: { duplicateLeadId: duplicated.id },
    });
    await createActivity({
      type: "Note",
      subject: "Lead duplicated",
      description: `Duplicated from "${leadDisplayName(source)}"`,
      status: "Completed",
      leadId: duplicated.id,
    });

    return NextResponse.json(leadToUI(duplicated), { status: 201 });
  } catch (err) {
    logServerError(`POST /api/leads/${id}/duplicate`, err);
    return serverError("Failed to duplicate lead");
  }
}
