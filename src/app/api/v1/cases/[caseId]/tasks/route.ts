import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

export const runtime = "nodejs";

const optDate = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.date().optional());

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: optDate,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().optional(),
  requiresApproval: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const tasks = await prisma.task.findMany({
    where: { caseId, firmId: ctx.firmId },
    orderBy: [{ status: "asc" }, { order: "asc" }, { dueDate: "asc" }],
    include: { assignee: { select: { id: true, name: true } } },
  });
  return successResponse(tasks);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;

  const matter = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true } });
  if (!matter) return errorResponse("Matter not found", 404);

  let input: z.infer<typeof createSchema>;
  try {
    input = createSchema.parse(await request.json());
  } catch {
    return errorResponse("A task title is required", 400);
  }

  const task = await prisma.task.create({
    data: {
      firmId: ctx.firmId,
      caseId,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? "MEDIUM",
      assigneeId: input.assigneeId || null,
      requiresApproval: input.requiresApproval ?? false,
      status: input.requiresApproval ? "WAITING_APPROVAL" : "TODO",
    },
  });
  return successResponse(task, 201);
}
