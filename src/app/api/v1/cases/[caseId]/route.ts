import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { updateCaseSchema, normalizeCaseInput } from "@/lib/validators/case.schema";

/** Update matter fields (assignment, status, details). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;

  const existing = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true, title: true, caseNumber: true, responsibleAttorneyId: true } });
  if (!existing) return errorResponse("Case not found", 404);

  let input;
  try { input = updateCaseSchema.parse(await request.json()); }
  catch { return errorResponse("Validation failed", 400); }

  const updated = await prisma.case.update({ where: { id: caseId }, data: normalizeCaseInput(input) });

  // Audit assignment changes specifically (matters for malpractice accountability).
  if (input.responsibleAttorneyId !== undefined && input.responsibleAttorneyId !== existing.responsibleAttorneyId) {
    const who = input.responsibleAttorneyId
      ? (await prisma.user.findFirst({ where: { id: input.responsibleAttorneyId, firmId: ctx.firmId }, select: { name: true } }))?.name || "someone"
      : "Unassigned";
    await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "case.assign", category: "config", entity: "Case", entityId: caseId, entityLabel: `${existing.caseNumber} · ${existing.title}`, details: `Responsible attorney → ${who}` });
  }
  return successResponse(updated);
}

/** Delete a matter and its dependent records (deadlines, docs, tasks, etc. cascade). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "matter.delete")) return errorResponse("Only an admin or partner can delete a matter.", 403);
  const { caseId } = await params;

  const existing = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true, title: true, caseNumber: true } });
  if (!existing) return errorResponse("Case not found", 404);

  await prisma.case.delete({ where: { id: caseId } });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "case.delete", entity: "Case", entityId: caseId, entityLabel: `${existing.caseNumber} · ${existing.title}` });
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
