import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createLeadSchema } from "@/lib/validators/lead.schema";
import { createLeadFromIntake } from "@/lib/intake-pipeline";
import { publicBaseUrl } from "@/lib/base-url";
import { firmIntakeAddress } from "@/lib/intake-email";

export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get("page") || "1");
  const limit = parseInt(sp.get("limit") || "100");
  const stage = sp.get("stage") || "";
  const source = sp.get("source") || "";

  const where = {
    firmId: ctx.firmId,
    ...(stage && { stage: stage as never }),
    ...(source && { source: source as never }),
  };

  const [leads, total, firm] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
    prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { publicId: true } }),
  ]);

  // Build the shareable public intake link from the configured public URL
  // (request origin is the internal proxy address in production).
  const intakeLink = firm ? `${publicBaseUrl(request)}/consult/${firm.publicId}` : null;
  const intakeEmail = firm ? firmIntakeAddress(firm.publicId) : null;

  return Response.json({
    success: true,
    data: leads,
    intakeLink,
    intakeEmail,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const input = createLeadSchema.parse(body);

    const { lead, conflict } = await createLeadFromIntake({
      firmId: ctx.firmId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      source: input.source,
      caseType: input.caseType,
      description: input.description || null,
      adverseParties: input.adverseParties,
    });

    return successResponse({ lead, conflictStatus: conflict.status }, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Create lead error:", error);
    return errorResponse("Internal server error", 500);
  }
}
