import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError, badRequest } from "@/lib/server/api";
import { logAudit } from "@/lib/server/records";
import type { PipelineStageName } from "@/generated/prisma/client";
export const dynamic = "force-dynamic";

/**
 * Seeds a small, realistic dataset for first-time onboarding — a few
 * companies, contacts, customers, opportunities, and activities so the
 * dashboard, pipeline, and 360 views have something to render immediately.
 *
 * Idempotency: this refuses to run when the workspace already contains
 * companies (the strongest signal that real or sample data already exists),
 * so re-running it can never duplicate rows. Users can safely retry the
 * "Load sample data" step after a partial failure.
 */
export async function POST() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const [existingCompanies, existingStages] = await Promise.all([
      prisma.company.count({ where: { organizationId: user.organizationId } }),
      prisma.pipelineStage.findMany({ select: { id: true, name: true } }),
    ]);
    if (existingCompanies > 0) {
      return badRequest("Sample data is only available for an empty workspace");
    }

    // Ensure the six canonical pipeline stages exist (idempotent upsert).
    const stageNames: PipelineStageName[] = [
      "Discovery",
      "Qualification",
      "Proposal",
      "Negotiation",
      "ClosedWon",
      "ClosedLost",
    ];
    const stageIds = new Map<string, string>();
    for (const [index, name] of stageNames.entries()) {
      const stage =
        existingStages.find((s) => s.name === name) ??
        (await prisma.pipelineStage.create({ data: { name, order: index } }));
      stageIds.set(name, stage.id);
    }
    const stageId = (name: PipelineStageName) => stageIds.get(name);

    // ---- Companies ----
    const companyData = [
      { companyName: "Acme Corp", industry: "Manufacturing", city: "Chicago", country: "USA", website: "https://acme.example.com", email: "hello@acme.example.com", phone: "+1 555-0100", employeeCount: 480, size: "Enterprise", status: "Active" },
      { companyName: "Northwind Inc.", industry: "Retail", city: "Seattle", country: "USA", website: "https://northwind.example.com", email: "info@northwind.example.com", phone: "+1 555-0200", employeeCount: 210, size: "Mid-market", status: "Active" },
      { companyName: "Contoso Ltd.", industry: "Technology", city: "Austin", country: "USA", website: "https://contoso.example.com", email: "sales@contoso.example.com", phone: "+1 555-0300", employeeCount: 95, size: "SMB", status: "Prospect" },
      { companyName: "Tailspin Toys", industry: "E-commerce", city: "Denver", country: "USA", website: "https://tailspin.example.com", email: "team@tailspin.example.com", phone: "+1 555-0400", employeeCount: 34, size: "SMB", status: "Prospect" },
    ] as const;

    const companies = [];
    for (const c of companyData) {
      companies.push(
        await prisma.company.create({
          data: { ...c, organization: { connect: { id: user.organizationId } } },
        }),
      );
    }
    const companyByName = new Map(companies.map((c) => [c.companyName, c]));

    // ---- Customers (decision-makers at each company) ----
    const customerData = [
      { name: "John Smith", email: "john@acme.example.com", companyName: "Acme Corp", position: "VP of Sales", status: "Active" },
      { name: "Maria Rodriguez", email: "maria@acme.example.com", companyName: "Acme Corp", position: "Operations Director", status: "Active" },
      { name: "Alex Kim", email: "alex@northwind.example.com", companyName: "Northwind Inc.", position: "CTO", status: "Active" },
      { name: "Sarah Johnson", email: "sarah@contoso.example.com", companyName: "Contoso Ltd.", position: "Procurement Manager", status: "Prospect" },
      { name: "Tom Baker", email: "tom@tailspin.example.com", companyName: "Tailspin Toys", position: "Founder", status: "Prospect" },
    ] as const;

    const customers = [];
    for (const cu of customerData) {
      customers.push(
        await prisma.customer.create({
          data: {
            name: cu.name,
            email: cu.email,
            position: cu.position,
            status: cu.status === "Active" ? "Active" : "Prospect",
            companyId: companyByName.get(cu.companyName)?.id,
            organizationId: user.organizationId,
          },
        }),
      );
    }
    const customerByName = new Map(customers.map((c) => [c.name, c]));

    // ---- Contacts (people at each company) ----
    const contactData = [
      { firstName: "John", lastName: "Smith", email: "john@acme.example.com", companyName: "Acme Corp", position: "VP of Sales", role: "Decision Maker" },
      { firstName: "Maria", lastName: "Rodriguez", email: "maria@acme.example.com", companyName: "Acme Corp", position: "Operations Director", role: "Champion" },
      { firstName: "Alex", lastName: "Kim", email: "alex@northwind.example.com", companyName: "Northwind Inc.", position: "CTO", role: "Decision Maker" },
      { firstName: "Sarah", lastName: "Johnson", email: "sarah@contoso.example.com", companyName: "Contoso Ltd.", position: "Procurement Manager", role: "Influencer" },
      { firstName: "Tom", lastName: "Baker", email: "tom@tailspin.example.com", companyName: "Tailspin Toys", position: "Founder", role: "Economic Buyer" },
      { firstName: "Nina", lastName: "Patel", email: "nina@contoso.example.com", companyName: "Contoso Ltd.", position: "Data Lead", role: "Technical Evaluator" },
    ] as const;

    for (const ct of contactData) {
      await prisma.contact.create({
        data: {
          firstName: ct.firstName,
          lastName: ct.lastName,
          email: ct.email,
          position: ct.position,
          role: ct.role,
          status: "Active",
          companyId: companyByName.get(ct.companyName)?.id,
          organizationId: user.organizationId,
        },
      });
    }

    // ---- Opportunities (across the pipeline) ----
    const now = new Date();
    const inDays = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
    const opportunityData: {
      title: string;
      value: number;
      probability: number;
      priority: string;
      customerName: string;
      stage: PipelineStageName;
      expectedInDays: number;
    }[] = [
      { title: "Acme Q3 Platform Renewal", value: 245000, probability: 80, priority: "High", customerName: "John Smith", stage: "Negotiation", expectedInDays: 14 },
      { title: "Northwind ERP Migration", value: 189000, probability: 60, priority: "High", customerName: "Alex Kim", stage: "Proposal", expectedInDays: 30 },
      { title: "Contoso Data Pipeline", value: 95000, probability: 35, priority: "Medium", customerName: "Sarah Johnson", stage: "Qualification", expectedInDays: 60 },
      { title: "Tailspin E-commerce Suite", value: 32000, probability: 20, priority: "Medium", customerName: "Tom Baker", stage: "Discovery", expectedInDays: 75 },
      { title: "Acme Support Desk Add-on", value: 48000, probability: 55, priority: "Medium", customerName: "Maria Rodriguez", stage: "Proposal", expectedInDays: 21 },
    ];

    const opportunities = [];
    for (const o of opportunityData) {
      const customer = customerByName.get(o.customerName);
      opportunities.push(
        await prisma.opportunity.create({
          data: {
            title: o.title,
            value: o.value,
            probability: o.probability,
            priority: o.priority,
            status: "Open",
            expectedCloseDate: inDays(o.expectedInDays),
            stageId: stageId(o.stage),
            customerId: customer?.id,
            ownerId: user.id,
            organizationId: user.organizationId,
          },
        }),
      );
    }
    const opportunityByTitle = new Map(opportunities.map((o) => [o.title, o]));

    // ---- Activities (a mix of notes, tasks, meetings) ----
    const activityData: {
      type: "Call" | "Email" | "Meeting" | "Task" | "Note";
      subject: string;
      description: string;
      status: "Planned" | "Completed";
      dueInDays: number;
      customerName?: string;
      opportunityTitle?: string;
    }[] = [
      { type: "Meeting", subject: "Acme Q3 renewal kickoff", description: "Intro call with John to align on Q3 platform renewal scope.", status: "Completed", dueInDays: -3, customerName: "John Smith", opportunityTitle: "Acme Q3 Platform Renewal" },
      { type: "Email", subject: "Proposal sent — Northwind ERP Migration", description: "Sent draft proposal with pricing and implementation timeline.", status: "Completed", dueInDays: -1, customerName: "Alex Kim", opportunityTitle: "Northwind ERP Migration" },
      { type: "Task", subject: "Draft Contoso data pipeline SOW", description: "Scope discovery call notes into a statement of work.", status: "Planned", dueInDays: 3, customerName: "Sarah Johnson", opportunityTitle: "Contoso Data Pipeline" },
      { type: "Call", subject: "Discovery call — Tailspin", description: "Qualify e-commerce suite requirements and budget.", status: "Planned", dueInDays: 5, customerName: "Tom Baker", opportunityTitle: "Tailspin E-commerce Suite" },
      { type: "Note", subject: "Acme procurement notes", description: "Maria flagged a September budget review — plan pricing to land before then.", status: "Completed", dueInDays: -7, customerName: "Maria Rodriguez" },
    ];

    for (const a of activityData) {
      const customer = a.customerName ? customerByName.get(a.customerName) : undefined;
      const opportunity = a.opportunityTitle ? opportunityByTitle.get(a.opportunityTitle) : undefined;
      await prisma.activity.create({
        data: {
          type: a.type,
          subject: a.subject,
          description: a.description,
          status: a.status,
          dueDate: inDays(a.dueInDays),
          assigneeId: user.id,
          customerId: customer?.id ?? null,
          opportunityId: opportunity?.id ?? null,
          companyId: customer?.companyId ?? null,
          organizationId: user.organizationId,
        },
      });
    }

    await logAudit({
      entityType: "workspace",
      entityId: user.id,
      action: "onboarding.sample_data",
      description: "Sample data loaded for onboarding",
      userId: user.id,
      organizationId: user.organizationId,
      data: {
        companies: companies.length,
        customers: customers.length,
        opportunities: opportunities.length,
      },
    });

    return NextResponse.json({
      seeded: true,
      counts: {
        companies: companies.length,
        customers: customers.length,
        opportunities: opportunities.length,
      },
    });
  } catch (err) {
    logServerError("POST /api/onboarding/sample-data", err);
    return serverError("Failed to load sample data");
  }
}
