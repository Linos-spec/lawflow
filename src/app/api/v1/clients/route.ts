import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api/response";
import { createClientSchema, normalizeClientInput } from "@/lib/validators/client.schema";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const clientType = searchParams.get("clientType") || "";

  const where = {
    firmId: ctx.firmId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(clientType && { clientType: clientType as "INDIVIDUAL" | "BUSINESS_ENTITY" | "GOVERNMENT" }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { cases: true, billingRecords: true } },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return paginatedResponse(clients, total, page, limit);
}

export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const validated = createClientSchema.parse(body);

    const client = await prisma.client.create({
      data: { ...normalizeClientInput(validated), firmId: ctx.firmId },
    });

    await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "client.create", entity: "Client", entityId: client.id, entityLabel: client.name });
    return successResponse(client, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Create client error:", error);
    return errorResponse("Internal server error", 500);
  }
}
