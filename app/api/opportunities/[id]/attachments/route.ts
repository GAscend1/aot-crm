import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, subscriptionWriteGate } from "@/lib/server/api";
import { logAudit, createActivity, createNotification } from "@/lib/server/records";
import { resolveDocumentStorage, sanitizeFileName, resolveBucket } from "@/lib/storage/DocumentStorage";
export const dynamic = "force-dynamic";

export type OpportunityAttachment = {
  id: string;
  name: string;
  mimeType: string | null;
  size: number | null;
  type: string | null;
  category: string | null;
  createdAt: string;
  uploadedByName: string | null;
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const opp = await prisma.opportunity.findFirst({ where: { id, organizationId: user.organizationId }, select: { id: true } });
    if (!opp) return notFound("Opportunity not found");
    const docs = await prisma.document.findMany({
      where: { opportunityId: id, status: { not: "Archived" }, organizationId: user.organizationId },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const data: OpportunityAttachment[] = docs.map((d) => ({
      id: d.id,
      name: d.name,
      mimeType: d.mimeType,
      size: d.size,
      type: d.type,
      category: d.category,
      createdAt: d.createdAt.toISOString(),
      uploadedByName: d.uploadedBy?.name ?? null,
    }));
    return NextResponse.json({ data });
  } catch (err) {
    logServerError(`GET /api/opportunities/${id}/attachments`, err);
    return serverError("Failed to fetch documents");
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const opp = await prisma.opportunity.findFirst({ where: { id, organizationId: user.organizationId }, select: { id: true, title: true, ownerId: true } });
    if (!opp) return notFound("Opportunity not found");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const documentType = (form.get("type") as string) || "Other";
    const bucket = resolveBucket();
    const storage = resolveDocumentStorage();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name);
    const doc = await prisma.document.create({
      data: {
        name: safeName,
        mimeType: file.type || null,
        size: bytes.byteLength,
        type: documentType,
        category: documentType,
        opportunityId: id,
        uploadedById: user.id,
        organizationId: user.organizationId,
        status: "Active",
      },
    });
    const storageKey = `opportunities/${id}/attachments/${doc.id}/${safeName}`;
    const uploaded = await storage.upload(bucket, storageKey, bytes, file.type || "application/octet-stream");
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        storageKey: uploaded.storageKey,
        checksum: uploaded.checksum,
        size: uploaded.size,
        storageProvider: storage.provider,
      },
    });

    await logAudit({
      entityType: "opportunity",
      entityId: id,
      action: "opportunity.document_uploaded",
      description: `Document "${safeName}" uploaded to opportunity "${opp.title}"`,
      userId: user.id,
      organizationId: user.organizationId,
      data: { documentId: doc.id, size: uploaded.size },
    });
    await createActivity({
      type: "Note",
      subject: `Document "${safeName}" uploaded`,
      status: "Completed",
      opportunityId: id,
      customerId: null,
      organizationId: user.organizationId,
    });
    await createNotification({
      userId: user.id,
      organizationId: user.organizationId,
      type: "Success",
      title: "Document uploaded",
      message: `"${safeName}" was uploaded to ${opp.title}`,
      entityType: "opportunity",
      entityId: id,
      actionLink: `/opportunities/${id}`,
    });

    const finalDoc = await prisma.document.findUnique({
      where: { id: doc.id },
      include: { uploadedBy: { select: { name: true } } },
    });
    return NextResponse.json(
      {
        data: {
          id: finalDoc!.id,
          name: finalDoc!.name,
          mimeType: finalDoc!.mimeType,
          size: finalDoc!.size,
          type: finalDoc!.type,
          category: finalDoc!.category,
          createdAt: finalDoc!.createdAt.toISOString(),
          uploadedByName: finalDoc!.uploadedBy?.name ?? null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logServerError(`POST /api/opportunities/${id}/attachments`, err);
    return serverError("Failed to upload document");
  }
}

