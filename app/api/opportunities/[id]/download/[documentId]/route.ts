import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { resolveDocumentStorage, resolveBucket } from "@/lib/storage/DocumentStorage";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id, documentId } = await params;
  try {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, opportunityId: id, organizationId: user.organizationId },
    });
    if (!doc) return notFound("Document not found");
    if (!doc.storageKey) {
      return NextResponse.json({ error: "Document has no storage location" }, { status: 409 });
    }
    const storage = resolveDocumentStorage();
    const url = await storage.createDownloadUrl(resolveBucket(), doc.storageKey, 900);
    return NextResponse.json({ url });
  } catch (err) {
    logServerError(`GET /api/opportunities/${id}/download/${documentId}`, err);
    return serverError("Failed to create download link");
  }
}
