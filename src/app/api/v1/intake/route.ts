import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

/** Intake queue + per-status counts for the AI Intake workspace. */
export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status") || "";
  const q = (sp.get("q") || "").trim();

  const where: Prisma.LeadWhereInput = {
    firmId: ctx.firmId,
    ...(status && { intakeStatus: status as Prisma.LeadWhereInput["intakeStatus"] }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [items, grouped] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, name: true, caseType: true, intakeStatus: true,
        conflictStatus: true, qualified: true, aiPriority: true, createdAt: true,
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    prisma.lead.groupBy({
      by: ["intakeStatus"],
      where: { firmId: ctx.firmId },
      _count: { _all: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const g of grouped) counts[g.intakeStatus] = g._count._all;

  return successResponse({ items, counts });
}
