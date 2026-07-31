import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { logAudit, createActivity, leadDisplayName } from "@/lib/server/records";
import { resolveDocumentStorage, sanitizeFileName, resolveBucket } from "@/lib/storage/DocumentStorage";

export type LeadAttachment = {
  id: string;
  name: string;
  mimeType: string | null;
  size: number | null;
  checksum: string | null;
  category: string | null;
  createdAt: string;
  uploadedByName: string | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
    if (!lead) return notFound("Lead not found");
    const docs = await prisma.document.findMany({
      where: { leadId: id, status: { not: "Archived" } },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const data: LeadAttachment[] = docs.map((d) => ({
      id: d.id,
      name: d.name,
      mimeType: d.mimeType,
      size: d.size,
      checksum: d.checksum,
      category: d.category,
      createdAt: d.createdAt.toISOString(),
      uploadedByName: d.uploadedBy?.name ?? null,
    }));
    return NextResponse.json({ data });
  } catch (err) {
    logServerError(`GET /api/leads/${id}/attachments`, err);
    return serverError("Failed to fetch attachments");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return notFound("Lead not found");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bucket = resolveBucket();
    const storage = resolveDocumentStorage();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name);
    const doc = await prisma.document.create({
      data: {
        name: safeName,
        mimeType: file.type || null,
        size: bytes.byteLength,
        type: (form.get("type") as string) || inferType(file.type) || null,
        category: (form.get("category") as string) || "Attachment",
        leadId: id,
        uploadedById: user.id,
        status: "Active",
      },
    });
    const storageKey = `leads/${id}/attachments/${doc.id}/${safeName}`;
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
      entityType: "lead",
      entityId: id,
      action: "lead.document_uploaded",
      description: `Document "${safeName}" uploaded to lead "${leadDisplayName(lead)}"`,
      userId: user.id,
      data: { documentId: doc.id, size: uploaded.size },
    });
    await createActivity({
      type: "Note",
      subject: `Document "${safeName}" uploaded`,
      status: "Completed",
      leadId: id,
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
          checksum: finalDoc!.checksum,
          category: finalDoc!.category,
          createdAt: finalDoc!.createdAt.toISOString(),
          uploadedByName: finalDoc!.uploadedBy?.name ?? null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logServerError(`POST /api/leads/${id}/attachments`, err);
    return serverError("Failed to upload attachment");
  }
}

function inferType(mime?: string): string {
  if (!mime) return "Other";
  if (mime === "application/pdf") return "PDF";
  if (mime.includes("word")) return "DOCX";
  if (mime.includes("sheet")) return "XLSX";
  if (mime.includes("presentation")) return "PPTX";
  if (mime.startsWith("image/")) return "Image";
  return "Other";
}
