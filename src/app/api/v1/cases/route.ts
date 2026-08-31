import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { entitledOr402 } from "@/lib/entitlement";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api/response";
import { createCaseSchema, normalizeCaseInput } from "@/lib/validators/case.schema";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where = {
    firmId: ctx.firmId,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { caseNumber: { contains: search, mode: "insensitive" as const } },
        { client: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status: status as "OPEN" | "ACTIVE" | "ON_HOLD" | "PENDING" | "CLOSED" | "ARCHIVED" }),
  };

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        client: { select: { id: true, name: true } },
        responsibleAttorney: { select: { id: true, name: true } },
        // Soonest still-open deadline → "Next deadline" column.
        deadlines: {
          where: { status: { in: ["PENDING", "OVERDUE"] } },
          orderBy: { dueDate: "asc" },
          take: 1,
          select: { dueDate: true, title: true, status: true },
        },
        _count: { select: { deadlines: true, billingRecords: true } },
      },
    }),
    prisma.case.count({ where }),
  ]);

  return paginatedResponse(cases, total, page, limit);
}

export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const _billBlock = await entitledOr402(ctx.firmId); if (_billBlock) return _billBlock;

  try {
    const body = await request.json();
    const validated = createCaseSchema.parse(body);

    // Use the firm's internal number if provided; otherwise auto-generate.
    const override = validated.caseNumber?.trim();
    const count = await prisma.case.count({ where: { firmId: ctx.firmId } });
    const caseNumber = override || `LF-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const newCase = await prisma.case.create({
      data: { ...normalizeCaseInput(validated), caseNumber, firmId: ctx.firmId },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "case.create", entity: "Case", entityId: newCase.id, entityLabel: `${newCase.caseNumber} · ${newCase.title}` });
    return successResponse(newCase, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Create case error:", error);
    return errorResponse("Internal server error", 500);
  }
}
