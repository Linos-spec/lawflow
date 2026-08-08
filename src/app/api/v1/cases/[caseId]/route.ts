import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";

/** Delete a matter and its dependent records (deadlines, docs, tasks, etc. cascade). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;

  const existing = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true } });
  if (!existing) return errorResponse("Case not found", 404);

  await prisma.case.delete({ where: { id: caseId } });
  return successResponse({ deleted: true });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { caseId } = await params;

  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, firmId: ctx.firmId },
    include: {
      client: true,
      deadlines: { orderBy: { dueDate: "asc" } },
      billingRecords: {
        orderBy: { createdAt: "desc" },
        include: { lineItems: true },
      },
    },
  });

  if (!caseRecord) {
    return errorResponse("Case not found", 404);
  }

  return successResponse(caseRecord);
}
