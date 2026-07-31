import { prisma } from "../lib/prisma";

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('Quote','QuoteItem','Invoice','InvoiceItem','PipelineStage','OpportunityStageHistory')`
  );
  console.log("FOUND:" + JSON.stringify(tables));
  const stages = await prisma.$queryRawUnsafe(`SELECT id, name, "order" FROM "PipelineStage" ORDER BY "order"`);
  console.log("STAGES:" + JSON.stringify(stages));
  const counts = await prisma.$queryRawUnsafe(
    `SELECT 'Quote' as t, count(*)::int as c FROM "Quote" UNION ALL SELECT 'Invoice', count(*)::int FROM "Invoice" UNION ALL SELECT 'Opportunity', count(*)::int FROM "Opportunity" UNION ALL SELECT 'Lead', count(*)::int FROM "Lead"`
  );
  console.log("COUNTS:" + JSON.stringify(counts));
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
