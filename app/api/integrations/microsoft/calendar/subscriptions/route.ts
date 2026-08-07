import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
import { graphFetch, GraphServerError } from "@/services/graph-server";
import { getGraphToken } from "@/services/graph-server";
export const dynamic = "force-dynamic";

/**
 * Webhook subscription lifecycle for Microsoft Graph calendar change
 * notifications. Requires a public HTTPS notification URL — in local/dev
 * environments set `MICROSOFT_GRAPH_WEBHOOK_URL` to a tunneled URL. When it is
 * unset, the endpoint reports 503 and the CRM falls back to delta polling.
 */

function appOrigin(): string {
  if (process.env.MICROSOFT_GRAPH_WEBHOOK_URL) return process.env.MICROSOFT_GRAPH_WEBHOOK_URL;
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const CLIENT_STATE = process.env.MICROSOFT_GRAPH_WEBHOOK_CLIENT_STATE ?? "aot-crm-calendar";

interface Subscription {
  id: string;
  expirationDateTime?: string;
}

const createSubscriptionSchema = z.object({
  resource: z
    .string()
    .optional()
    .default("/me/events"),
  changeType: z.array(z.enum(["created", "updated", "deleted"])).optional().default(["created", "updated", "deleted"]),
});

export async function POST(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  if (!process.env.MICROSOFT_GRAPH_WEBHOOK_URL) {
    return NextResponse.json(
      {
        error:
          "Webhook notifications require a public URL. Set MICROSOFT_GRAPH_WEBHOOK_URL to enable; delta polling is used otherwise.",
        code: "webhook_not_configured",
      },
      { status: 503 },
    );
  }

  try {
    const parsed = createSubscriptionSchema.parse(await request.json().catch(() => ({})));
    const notificationUrl = `${appOrigin().replace(/\/$/, "")}/api/integrations/microsoft/calendar/webhook`;

    const accessToken = await getGraphToken(request);
    const existing = await prisma.webhookSubscription.findFirst({
      where: { userId: user.id, resource: parsed.resource },
    });

    const body: Record<string, unknown> = {
      changeType: parsed.changeType.join(","),
      notificationUrl,
      resource: parsed.resource,
      expirationDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 48h (max allowed)
      clientState: CLIENT_STATE,
    };

    let subscription: Subscription;
    if (existing?.graphSubscriptionId) {
      const result = await graphFetch(accessToken, `/subscriptions/${existing.graphSubscriptionId}`, {
        method: "PATCH",
        body: JSON.stringify({ expirationDateTime: body.expirationDateTime }),
      }) as Subscription;
      subscription = result;
    } else {
      const result = await graphFetch(accessToken, "/subscriptions", {
        method: "POST",
        body: JSON.stringify(body),
      }) as Subscription;
      subscription = result;
    }

    await prisma.webhookSubscription.upsert({
      where: { id: existing?.id ?? "new" },
      update: {
        graphSubscriptionId: subscription.id,
        resource: parsed.resource,
        expirationDateTime: subscription.expirationDateTime ? new Date(subscription.expirationDateTime) : null,
      },
      create: {
        graphSubscriptionId: subscription.id,
        resource: parsed.resource,
        expirationDateTime: subscription.expirationDateTime ? new Date(subscription.expirationDateTime) : null,
        userId: user.id,
      },
    });

    return NextResponse.json({ subscriptionId: subscription.id, expirationDateTime: subscription.expirationDateTime });
  } catch (err) {
    if (err instanceof GraphServerError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    logServerError("POST /api/integrations/microsoft/calendar/subscriptions", err);
    return serverError("Failed to manage subscription");
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCrmUser();
  if (!user) return unauthorized();

  try {
    const existing = await prisma.webhookSubscription.findFirst({
      where: { userId: user.id, resource: "/me/events" },
    });
    if (!existing?.graphSubscriptionId) {
      return NextResponse.json({ success: true });
    }

    const accessToken = await getGraphToken(request);
    await graphFetch(accessToken, `/subscriptions/${existing.graphSubscriptionId}`, { method: "DELETE" });
    await prisma.webhookSubscription.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof GraphServerError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    logServerError("DELETE /api/integrations/microsoft/calendar/subscriptions", err);
    return serverError("Failed to delete subscription");
  }
}
