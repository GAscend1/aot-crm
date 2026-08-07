import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { dbStageToUi } from "@/lib/server/opportunity-stages";
export const dynamic = "force-dynamic";

export type TimelineEntry = {
  id: string;
  type: "created" | "stage" | "activity" | "quote" | "invoice" | "document" | "meeting" | "assignment" | "audit";
  title: string;
  description: string;
  timestamp: string;
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const opp = await prisma.opportunity.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        stageHistory: { include: { fromStage: true, toStage: true } },
        activities: true,
        quotes: { include: { createdBy: true } },
        invoices: true,
        documents: { include: { uploadedBy: true } },
        calendarEvents: true,
        owner: true,
      },
    });
    if (!opp) return notFound("Opportunity not found");

    const entries: TimelineEntry[] = [];

    entries.push({
      id: `created-${opp.id}`,
      type: "created",
      title: "Opportunity created",
      description: `${opp.title} was created`,
      timestamp: opp.createdAt.toISOString(),
    });

    for (const h of opp.stageHistory) {
      entries.push({
        id: `stage-${h.id}`,
        type: "stage",
        title: "Stage changed",
        description: `Moved from ${h.fromStage ? dbStageToUi(h.fromStage.name) : "—"} to ${dbStageToUi(h.toStage.name)}`,
        timestamp: h.createdAt.toISOString(),
      });
    }

    for (const a of opp.activities) {
      entries.push({
        id: `activity-${a.id}`,
        type: "activity",
        title: `${a.subject}`,
        description: a.description ?? "",
        timestamp: a.createdAt.toISOString(),
      });
    }

    for (const q of opp.quotes) {
      entries.push({
        id: `quote-${q.id}`,
        type: "quote",
        title: `Quote ${q.quoteNumber} ${q.status === "ACCEPTED" ? "accepted" : q.status === "SENT" ? "sent" : "created"}`,
        description: `$${q.total.toLocaleString()} ${q.currency}`,
        timestamp: q.createdAt.toISOString(),
      });
    }

    for (const inv of opp.invoices) {
      entries.push({
        id: `invoice-${inv.id}`,
        type: "invoice",
        title: `Invoice ${inv.invoiceNumber}`,
        description: `Status: ${inv.status.replace("_", " ").toLowerCase()} · $${inv.total.toLocaleString()}`,
        timestamp: inv.createdAt.toISOString(),
      });
    }

    for (const d of opp.documents) {
      entries.push({
        id: `document-${d.id}`,
        type: "document",
        title: `Document "${d.name}" uploaded`,
        description: `Uploaded by ${d.uploadedBy?.name ?? "user"}`,
        timestamp: d.createdAt.toISOString(),
      });
    }

    for (const ev of opp.calendarEvents) {
      entries.push({
        id: `meeting-${ev.id}`,
        type: "meeting",
        title: `Meeting "${ev.title}" scheduled`,
        description: `${ev.startTime ? new Date(ev.startTime).toLocaleString() : ""}`,
        timestamp: ev.createdAt.toISOString(),
      });
    }

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ data: entries });
  } catch (err) {
    logServerError(`GET /api/opportunities/${id}/timeline`, err);
    return serverError("Failed to fetch timeline");
  }
}
