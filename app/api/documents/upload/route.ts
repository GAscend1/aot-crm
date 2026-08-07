import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, subscriptionWriteGate, notFound } from "@/lib/server/api";
import { logAudit, createActivity } from "@/lib/server/records";
import { resolveDocumentStorage, sanitizeFileName, resolveBucket } from "@/lib/storage/DocumentStorage";
export const dynamic = "force-dynamic";

const ENTITY_KINDS = ["company", "customer", "opportunity", "lead"] as const;
type EntityKind = (typeof ENTITY_KINDS)[number];

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  try {
    const { searchParams } = new URL(request.url);
    const entityKind = searchParams.get("entityKind") as EntityKind | null;
    const entityId = searchParams.get("entityId") ?? "";
    if (!entityKind || !ENTITY_KINDS.includes(entityKind) || !entityId) {
      return NextResponse.json({ error: "entityKind and entityId are required" }, { status: 400 });
    }

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

    // Tenant isolation: verify the target entity belongs to the caller's
    // organization before linking a document to it (IDOR guard).
    const owned = await (async () => {
      const where = { id: entityId, organizationId: user.organizationId } as const;
      switch (entityKind) {
        case "company":
          return prisma.company.findFirst({ where, select: { id: true } });
        case "customer":
          return prisma.customer.findFirst({ where, select: { id: true } });
        case "opportunity":
          return prisma.opportunity.findFirst({ where, select: { id: true } });
        case "lead":
          return prisma.lead.findFirst({ where, select: { id: true } });
      }
    })();
    if (!owned) return notFound(`${entityKind} not found`);

    const entityField =
      entityKind === "company" ? "companyId" : `${entityKind}Id`;
    const doc = await prisma.document.create({
      data: {
        name: safeName,
        mimeType: file.type || null,
        size: bytes.byteLength,
        type: documentType,
        category: documentType,
        uploadedById: user.id,
        organizationId: user.organizationId,
        status: "Active",
        [entityField]: entityId,
      },
    });

    const storageKey = `${entityKind}s/${entityId}/documents/${doc.id}/${safeName}`;
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
      entityType: entityKind,
      entityId,
      action: `${entityKind}.document_uploaded`,
      description: `Document "${safeName}" uploaded`,
      userId: user.id,
      organizationId: user.organizationId,
      data: { documentId: doc.id, size: uploaded.size },
    });

    // Timeline entry — visible on the 360 activity feed. The activity links
    // the uploaded record so it surfaces on the matching entity timeline.
    await createActivity({
      type: "Note",
      subject: `Document "${safeName}" uploaded`,
      status: "Completed",
      companyId: entityKind === "company" ? entityId : null,
      customerId: entityKind === "customer" ? entityId : null,
      opportunityId: entityKind === "opportunity" ? entityId : null,
      leadId: entityKind === "lead" ? entityId : null,
      organizationId: user.organizationId,
    });

    return NextResponse.json({ data: { id: doc.id, name: safeName } }, { status: 201 });
  } catch (err) {
    logServerError("POST /api/documents/upload", err);
    return serverError("Failed to upload document");
  }
}
