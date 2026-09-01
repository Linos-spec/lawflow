import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";

/** Admin toggle: require all firm users to set up two-factor authentication. */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "team.manage")) return errorResponse("Only an admin can change this.", 403);

  let body: { required?: boolean };
  try { body = await req.json(); } catch { return errorResponse("Invalid request", 400); }
  const required = !!body.required;

  await prisma.firm.update({ where: { id: ctx.firmId }, data: { mfaRequired: required } });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "firm.mfa_required", category: "config", entity: "Firm", entityId: ctx.firmId, entityLabel: required ? "MFA required" : "MFA optional", details: required ? "Two-factor authentication is now required for all firm users" : "Two-factor authentication requirement removed" });
  return successResponse({ mfaRequired: required });
}
