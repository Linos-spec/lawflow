import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

export const runtime = "nodejs";

const optDate = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.date().optional().nullable());

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "WAITING_APPROVAL", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: optDate,
  assigneeId: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { taskId } = await params;

  const existing = await prisma.task.findFirst({ where: { id: taskId, firmId: ctx.firmId } });
  if (!existing) return errorResponse("Task not found", 404);

  let input: z.infer<typeof updateSchema>;
  try {
    input = updateSchema.parse(await request.json());
  } catch {
    return errorResponse("Validation failed", 400);
  }

  // Approval gate: completing a task that requires approval records the approver.
  const data: Record<string, unknown> = { ...input };
  if (input.status === "DONE" && existing.requiresApproval && !existing.approvedAt) {
    data.approvedById = ctx.userId;
    data.approvedAt = new Date();
  }

  const task = await prisma.task.update({ where: { id: taskId }, data });
  return successResponse(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { taskId } = await params;
  const existing = await prisma.task.findFirst({ where: { id: taskId, firmId: ctx.firmId }, select: { id: true } });
  if (!existing) return errorResponse("Task not found", 404);
  await prisma.task.delete({ where: { id: taskId } });
  return successResponse({ deleted: true });
}
