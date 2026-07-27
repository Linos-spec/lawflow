import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse } from "@/lib/api/response";

export const runtime = "nodejs";

/** All deliveries for the firm — powers the Delivery module page. */
export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const status = request.nextUrl.searchParams.get("status") || "";
  const deliveries = await prisma.deliveryRequest.findMany({
    where: { firmId: ctx.firmId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { case: { select: { id: true, caseNumber: true, title: true } } },
  });
  return successResponse(deliveries);
}
