import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmUser, unauthorized, serverError, logServerError } from "@/lib/server/api";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCrmUser();
  if (!user) return unauthorized();
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: users });
  } catch (err) {
    logServerError("GET /api/users", err);
    return serverError("Failed to fetch users");
  }
}
