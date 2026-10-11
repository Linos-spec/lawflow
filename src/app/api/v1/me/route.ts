import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";

/** The signed-in user's own profile. */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.userId) return unauthorizedResponse();
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true, name: true, email: true, phone: true, barNumber: true, role: true },
  });
  if (!user) return errorResponse("User not found", 404);
  return successResponse(user);
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  barNumber: z.string().trim().max(60).nullable().optional(),
});

/** Update the signed-in user's own profile (name, phone, bar number). */
export async function PATCH(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.userId) return unauthorizedResponse();

  let input: z.infer<typeof schema>;
  try { input = schema.parse(await req.json()); }
  catch { return errorResponse("Validation failed", 400); }

  const user = await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.barNumber !== undefined ? { barNumber: input.barNumber || null } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, barNumber: true, role: true },
  });

  if (ctx.firmId) {
    await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "user.profile_update", category: "config", entity: "User", entityId: user.id, entityLabel: user.name, details: `Updated: ${Object.keys(input).join(", ")}` });
  }
  return successResponse(user);
}
