import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api/response";
import { createDeadlineSchema } from "@/lib/validators/deadline.schema";

export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status") || "";

  const where = {
    firmId: ctx.firmId,
    ...(status && { status: status as "PENDING" | "COMPLETED" | "OVERDUE" | "CANCELLED" }),
  };

  const [deadlines, total] = await Promise.all([
    prisma.deadline.findMany({
      where,
      orderBy: { dueDate: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        case: { select: { id: true, title: true, caseNumber: true } },
      },
    }),
    prisma.deadline.count({ where }),
  ]);

  return paginatedResponse(deadlines, total, page, limit);
}

export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validated = createDeadlineSchema.parse(body);

    const deadline = await prisma.deadline.create({
      data: {
        title: validated.title,
        dueDate: new Date(validated.dueDate),
        caseId: validated.caseId,
        deadlineType: validated.deadlineType,
        priority: validated.priority,
        description: validated.description || null,
        notes: validated.notes || null,
        firmId: ctx.firmId,
      },
      include: {
        case: { select: { id: true, title: true, caseNumber: true } },
      },
    });

    return successResponse(deadline, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Create deadline error:", error);
    return errorResponse("Internal server error", 500);
  }
}
