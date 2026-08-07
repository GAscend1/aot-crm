// Temporary E2E helper — verify the SalesInquiry persisted (masks PII).
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

(async () => {
  const recent = await p.salesInquiry.findMany({
    orderBy: { submittedAt: "desc" },
    take: 3,
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      preferredPlan: true,
      source: true,
      status: true,
      submittedAt: true,
    },
  });
  console.log("recent inquiries:", JSON.stringify(recent, null, 2));
  await pool.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
