import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound } from "@/lib/server/api";
import { leadConvertSchema } from "@/lib/validation/entities";
import { leadToUI } from "../../route";
import type { LeadStatus, PipelineStageName } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

function stageToEnum(stage?: string): PipelineStageName | undefined {
  const map: Record<string, PipelineStageName> = {
    Qualification: "Qualification",
    Discovery: "Discovery",
    Proposal: "Proposal",
    Negotiation: "Negotiation",
    "Closed Won": "ClosedWon",
    "Closed Lost": "ClosedLost",
  };
  return stage ? map[stage] : undefined;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = leadConvertSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id }, include: { assignedTo: true } });
      if (!lead) throw new Error("LEAD_NOT_FOUND");
      if (lead.status === "Converted" || lead.opportunityId || lead.convertedAt) {
        throw new Error("ALREADY_CONVERTED");
      }

      const leadName = `${lead.firstName} ${lead.lastName}`.trim();

      let companyId: string | null = null;
      const companyToFind = parsed.companyName || lead.companyName || leadName;
      if (parsed.companyId) {
        companyId = parsed.companyId;
      } else if (companyToFind) {
        const existingCompany = await tx.company.findFirst({
          where: { companyName: companyToFind },
        });
        const company = existingCompany ?? (await tx.company.create({ data: { companyName: companyToFind } }));
        companyId = company.id;
      }

      const customer = await tx.customer.create({
        data: {
          name: leadName || lead.companyName || "Converted customer",
          email: lead.email,
          phone: lead.phone,
          status: "Active",
          companyId,
        },
      });

      let contactId: string | null = null;
      if (parsed.contactId) {
        contactId = parsed.contactId;
      } else if (lead.firstName || lead.lastName) {
        const contact = await tx.contact.create({
          data: {
            firstName: lead.firstName || "Unknown",
            lastName: lead.lastName || "",
            email: lead.email,
            phone: lead.phone,
            companyId,
          },
        });
        contactId = contact.id;
      }

      let opportunityId: string | null = null;
      if (parsed.createOpportunity) {
        const stageName = stageToEnum(parsed.opportunityStage);
        const stage = stageName
          ? await tx.pipelineStage.findFirst({ where: { name: stageName } })
          : await tx.pipelineStage.findFirst({ orderBy: { order: "asc" } });
        const opportunity = await tx.opportunity.create({
          data: {
            title: parsed.opportunityTitle || `${leadName} — ${lead.companyName ?? "Opportunity"}`,
            value: parsed.opportunityValue ?? lead.expectedRevenue,
            probability: lead.probability,
            customerId: customer.id,
            stageId: stage?.id,
            ownerId: parsed.ownerId ?? lead.assignedToId,
            expectedCloseDate: parsed.opportunityCloseDate ? new Date(parsed.opportunityCloseDate) : lead.expectedCloseDate,
          },
        });
        opportunityId = opportunity.id;
      }

      const updated = await tx.lead.update({
        where: { id },
        data: {
          status: "Converted" as LeadStatus,
          convertedAt: new Date(),
          convertedById: user.id,
          customerId: customer.id,
          opportunityId,
        },
        include: { assignedTo: true },
      });

      await tx.auditLog.create({
        data: {
          entityType: "lead",
          entityId: id,
          action: "lead.converted",
          description: `Lead "${leadName}" converted to customer${opportunityId ? " and opportunity" : ""}`,
          userId: user.id,
          data: { customerId: customer.id, contactId, opportunityId, companyId },
        },
      });
      await tx.activity.create({
        data: {
          type: "Note",
          subject: "Lead converted",
          description: `Converted to customer ${customer.name}`,
          status: "Completed",
          leadId: id,
        },
      });

      return { lead: updated, customerId: customer.id, opportunityId };
    });

    return NextResponse.json({ ...leadToUI(result.lead), convertedCustomerId: result.customerId, convertedOpportunityId: result.opportunityId }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "LEAD_NOT_FOUND") return notFound("Lead not found");
    if (msg === "ALREADY_CONVERTED") {
      return NextResponse.json({ error: "Lead already converted" }, { status: 409 });
    }
    logServerError(`POST /api/leads/${id}/convert`, err);
    return serverError("Failed to convert lead");
  }
}
