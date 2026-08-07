import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, notFound, subscriptionWriteGate } from "@/lib/server/api";
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
  const gate = await subscriptionWriteGate(user);
  if (gate) return gate;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = leadConvertSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: { id, organizationId: user.organizationId },
        include: { assignedTo: true },
      });
      if (!lead) throw new Error("LEAD_NOT_FOUND");
      if (lead.status === "Converted" || lead.opportunityId || lead.convertedAt) {
        throw new Error("ALREADY_CONVERTED");
      }
      // Lifecycle: NEW → CONTACTED → QUALIFIED → CONVERTED. Only Qualified
      // leads may be converted (disqualified leads are rejected too).
      if (lead.status !== "Qualified") {
        throw new Error("NOT_QUALIFIED");
      }

      const leadName = `${lead.firstName} ${lead.lastName}`.trim();

      let companyId: string | null = null;
      const companyToFind = parsed.companyName || lead.companyName || leadName;
      if (parsed.companyId) {
        companyId = parsed.companyId;
      } else if (companyToFind) {
        const existingCompany = await tx.company.findFirst({
          where: { companyName: companyToFind, organizationId: user.organizationId },
        });
        const company = existingCompany ??
          (await tx.company.create({
            data: { companyName: companyToFind, organizationId: user.organizationId },
          }));
        companyId = company.id;
      }

      // Reuse an existing customer with the same email (org-scoped) instead of
      // creating a duplicate every time a lead converts. The Customer record
      // is the account behind the person — opportunities, quotes, invoices,
      // and tickets all hang off it.
      let customer =
        lead.email && lead.email.trim()
          ? await tx.customer.findFirst({
              where: {
                email: lead.email,
                organizationId: user.organizationId,
                archivedAt: null,
              },
              select: { id: true, contactId: true },
            })
          : null;
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: leadName || lead.companyName || "Converted customer",
            email: lead.email,
            phone: lead.phone,
            status: "Active",
            companyId,
            organizationId: user.organizationId,
          },
          select: { id: true, contactId: true },
        });
      }

      // Reuse an existing contact with the same email (org-scoped) before
      // creating a new one — duplicate Contact records must never be created
      // for the same person during conversion.
      let contactId: string | null = null;
      if (parsed.contactId) {
        contactId = parsed.contactId;
      } else if (lead.email && lead.email.trim()) {
        const existing = await tx.contact.findFirst({
          where: {
            email: lead.email,
            organizationId: user.organizationId,
            archivedAt: null,
          },
          select: { id: true },
        });
        contactId = existing?.id ?? null;
      }
      if (!contactId && (lead.firstName || lead.lastName)) {
        const contact = await tx.contact.create({
          data: {
            firstName: lead.firstName || "Unknown",
            lastName: lead.lastName || "",
            email: lead.email,
            phone: lead.phone,
            companyId,
            organizationId: user.organizationId,
          },
        });
        contactId = contact.id;
      }

      // Traceability: link the customer record back to the person contact so
      // the 360 view shows the person behind the account.
      if (contactId && !customer.contactId) {
        await tx.customer.update({
          where: { id: customer.id },
          data: { contactId },
        });
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
            organizationId: user.organizationId,
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
        include: { assignedTo: true, customer: { select: { contactId: true } } },
      });

      await tx.auditLog.create({
        data: {
          entityType: "lead",
          entityId: id,
          action: "lead.converted",
          description: `Lead "${leadName}" converted to customer${opportunityId ? " and opportunity" : ""}`,
          userId: user.id,
          organizationId: user.organizationId,
          data: { customerId: customer.id, contactId, opportunityId, companyId },
        },
      });
      await tx.activity.create({
        data: {
          type: "Note",
          subject: "Lead converted",
          description: `Converted to customer ${leadName}`,
          status: "Completed",
          leadId: id,
          organizationId: user.organizationId,
        },
      });

      return { lead: updated, customerId: customer.id, opportunityId };
    });

    return NextResponse.json(
      {
        ...leadToUI(result.lead),
        convertedCustomerId: result.customerId,
        convertedContactId: result.lead.customer?.contactId ?? null,
        convertedOpportunityId: result.opportunityId,
      },
      { status: 201 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "LEAD_NOT_FOUND") return notFound("Lead not found");
    if (msg === "ALREADY_CONVERTED") {
      return NextResponse.json({ error: "Lead already converted" }, { status: 409 });
    }
    if (msg === "NOT_QUALIFIED") {
      return NextResponse.json(
        { error: "Only qualified leads can be converted. Move the lead to Qualified first." },
        { status: 400 },
      );
    }
    logServerError(`POST /api/leads/${id}/convert`, err);
    return serverError("Failed to convert lead");
  }
}
