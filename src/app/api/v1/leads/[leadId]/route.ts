import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { updateLeadSchema } from "@/lib/validators/lead.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { leadId } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, firmId: ctx.firmId },
    include: {
      conflictChecks: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) return errorResponse("Lead not found", 404);
  return successResponse(lead);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { leadId } = await params;

  // Ensure the lead belongs to this firm (prevents cross-firm updates).
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, firmId: ctx.firmId },
    select: { id: true },
  });
  if (!existing) return errorResponse("Lead not found", 404);

  try {
    const body = await request.json();
    const input = updateLeadSchema.parse(body);

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(input.stage && { stage: input.stage }),
        ...(input.conflictStatus && { conflictStatus: input.conflictStatus }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.nextFollowUpAt !== undefined && {
          nextFollowUpAt: input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null,
        }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 400);
    }
    console.error("Update lead error:", error);
    return errorResponse("Internal server error", 500);
  }
}
