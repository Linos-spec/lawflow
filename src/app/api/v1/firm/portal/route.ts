import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";

/** Firm-wide client-portal settings + every matter with an active portal. */
export async function GET(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const firm = await prisma.firm.findUnique({
    where: { id: ctx.firmId },
    select: { portalEnabled: true, portalDefaultRequirePin: true, portalDefaultExpiryDays: true },
  });
  if (!firm) return errorResponse("Firm not found", 404);

  const active = await prisma.case.findMany({
    where: { firmId: ctx.firmId, portalEnabled: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, caseNumber: true, title: true, portalToken: true, portalPinHash: true, portalExpiresAt: true,
      client: { select: { name: true } },
    },
  });
  const origin = publicBaseUrl(req);

  return successResponse({
    settings: {
      portalEnabled: firm.portalEnabled,
      defaultRequirePin: firm.portalDefaultRequirePin,
      defaultExpiryDays: firm.portalDefaultExpiryDays,
    },
    portals: active.map((c) => ({
      caseId: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      clientName: c.client?.name ?? null,
      url: c.portalToken ? `${origin}/portal/${c.portalToken}` : null,
      hasPin: !!c.portalPinHash,
      expiresAt: c.portalExpiresAt ? c.portalExpiresAt.toISOString() : null,
    })),
    isAdmin: ctx.role === "ADMIN",
  });
}

const schema = z.object({
  portalEnabled: z.boolean().optional(),
  defaultRequirePin: z.boolean().optional(),
  defaultExpiryDays: z.number().int().min(0).max(3650).nullable().optional(),
});

/** Update firm-wide client-portal settings — admin only. */
export async function PATCH(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return forbiddenResponse();

  let input: z.infer<typeof schema>;
  try { input = schema.parse(await req.json()); } catch { return errorResponse("Validation failed", 400); }

  await prisma.firm.update({
    where: { id: ctx.firmId },
    data: {
      ...(input.portalEnabled !== undefined ? { portalEnabled: input.portalEnabled } : {}),
      ...(input.defaultRequirePin !== undefined ? { portalDefaultRequirePin: input.defaultRequirePin } : {}),
      ...(input.defaultExpiryDays !== undefined ? { portalDefaultExpiryDays: input.defaultExpiryDays || null } : {}),
    },
  });
  await logAudit({
    firmId: ctx.firmId, userId: ctx.userId, action: "firm.update", category: "config",
    entity: "Firm", entityId: ctx.firmId, entityLabel: "Client portal",
    details: `Portal settings: ${Object.keys(input).join(", ")}`,
  });
  return successResponse({ ok: true });
}
