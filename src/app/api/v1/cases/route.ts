import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api/response";
import { createCaseSchema } from "@/lib/validators/case.schema";

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

  try {
    const body = await request.json();
    const validated = createCaseSchema.parse(body);

    // Generate case number
    const count = await prisma.case.count({ where: { firmId: ctx.firmId } });
    const caseNumber = `LF-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title: validated.title,
        clientId: validated.clientId,
        caseType: validated.caseType,
        status: validated.status,
        priority: validated.priority,
        description: validated.description || null,
        notes: validated.notes || null,
        firmId: ctx.firmId,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return successResponse(newCase, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Create case error:", error);
    return errorResponse("Internal server error", 500);
  }
}
