// Temporary E2E verification helper — reads DB state (no secrets, masked).
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

function mask(v: string | null | undefined) {
  return v ? "[SET]" : v;
}

(async () => {
  const orgs = await p.organization.count();
  const subs = await p.subscription.count();
  const users = await p.user.count();
  const trials = await p.subscription.count({ where: { status: "TRIALING" } });
  console.log("organizations:", orgs);
  console.log("subscriptions:", subs, "TRIALING:", trials);
  console.log("users:", users);

  const recent = await p.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, name: true, microsoftTenantId: true, status: true, createdAt: true },
  });
  console.log(
    "recent orgs:",
    JSON.stringify(recent.map((o) => ({ ...o, microsoftTenantId: mask(o.microsoftTenantId) })))
  );

  const lastSubs = await p.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      planCode: true,
      status: true,
      source: true,
      trialStartedAt: true,
      trialEndsAt: true,
      organizationId: true,
    },
  });
  console.log("recent subs:", JSON.stringify(lastSubs));

  await pool.end();
})().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
