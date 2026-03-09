import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api/response";
import { createIntakeSchema } from "@/lib/validators/intake.schema";

export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status") || "";

  const where = {
    firmId: ctx.firmId,
    ...(status && {
      status: status as "PENDING" | "IN_REVIEW" | "CONVERTED" | "REJECTED" | "COMPLETED",
    }),
  };

  const [forms, total] = await Promise.all([
    prisma.intakeForm.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.intakeForm.count({ where }),
  ]);

  return paginatedResponse(forms, total, page, limit);
}

export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validated = createIntakeSchema.parse(body);

    const intakeForm = await prisma.intakeForm.create({
      data: {
        prospectName: validated.prospectName,
        prospectEmail: validated.prospectEmail || null,
        prospectPhone: validated.prospectPhone || null,
        caseType: validated.caseType,
        description: validated.description || null,
        notes: validated.notes || null,
        firmId: ctx.firmId,
      },
    });

    return successResponse(intakeForm, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Create intake error:", error);
    return errorResponse("Internal server error", 500);
  }
}
