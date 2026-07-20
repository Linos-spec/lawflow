import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { z } from "zod";

export const runtime = "nodejs";

/** Current firm settings — available to any authenticated firm member. */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const firm = await prisma.firm.findFirst({
    where: { id: ctx.firmId },
    select: { id: true, name: true, email: true, phone: true, website: true, address: true, aiModeEnabled: true, aiAutoCreateMatter: true, aiAutoGenerateTasks: true, aiAutoEngagementLetter: true },
  });
  if (!firm) return errorResponse("Firm not found", 404);
  return successResponse(firm);
}

const updateSchema = z.object({
  aiModeEnabled: z.boolean().optional(),
  aiAutoCreateMatter: z.boolean().optional(),
  aiAutoGenerateTasks: z.boolean().optional(),
  aiAutoEngagementLetter: z.boolean().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

/** Update firm settings — admin only (e.g. enabling AI Employee mode). */
export async function PATCH(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return forbiddenResponse();

  try {
    const input = updateSchema.parse(await request.json());
    const firm = await prisma.firm.update({
      where: { id: ctx.firmId },
      data: input,
      select: { id: true, name: true, aiModeEnabled: true, aiAutoCreateMatter: true, aiAutoGenerateTasks: true, aiAutoEngagementLetter: true },
    });
    return successResponse(firm);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return errorResponse("Validation failed", 400);
    return errorResponse("Failed to update firm", 500);
  }
}
