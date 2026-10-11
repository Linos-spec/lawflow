import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { computeEntitlement } from "@/lib/entitlement";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Platform-owner management of one firm. MVP action: extend the free trial
 * (does not touch Stripe). Gated to platform admins; recorded in the firm's
 * audit log so the firm can see the grant.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  const admin = await requirePlatformAdmin();
  if (!admin) return errorResponse("Not authorized", 403);
  const { firmId } = await params;

  let body: { action?: string; days?: number };
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }

  const firm = await prisma.firm.findUnique({ where: { id: firmId }, select: { id: true, name: true, trialEndsAt: true, subscriptionStatus: true } });
  if (!firm) return errorResponse("Firm not found", 404);

  if (body.action === "extend_trial") {
    const days = Math.min(365, Math.max(1, Math.round(Number(body.days) || 14)));
    // Extend from whichever is later: now, or the current trial end.
    const base = firm.trialEndsAt && firm.trialEndsAt.getTime() > Date.now() ? firm.trialEndsAt.getTime() : Date.now();
    const trialEndsAt = new Date(base + days * 86_400_000);
    await prisma.firm.update({ where: { id: firmId }, data: { trialEndsAt } });
    await logAudit({
      firmId, action: "platform.trial_extended", category: "config",
      entity: "Firm", entityId: firmId, entityLabel: firm.name,
      details: `Platform admin ${admin} extended the trial by ${days} days (now ends ${trialEndsAt.toISOString().slice(0, 10)})`,
    });
    const ent = computeEntitlement({ trialEndsAt, subscriptionStatus: firm.subscriptionStatus });
    return successResponse({ trialEndsAt: trialEndsAt.toISOString(), status: ent.status });
  }

  return errorResponse("Unknown action", 400);
}
