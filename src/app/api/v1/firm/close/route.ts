import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

/**
 * Permanently close the firm's account — deletes the organization, which cascades
 * to the firm, all firm-scoped data, and users. Irreversible. Requires an admin
 * and the exact firm name typed as confirmation. (Export first via /firm/export.)
 */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId || !ctx.organizationId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return errorResponse("Only an admin can close the account.", 403);

  let body: { confirm?: string };
  try { body = await req.json(); } catch { return errorResponse("Invalid request", 400); }

  const firm = await prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { name: true } });
  if (!firm) return errorResponse("Firm not found", 404);

  const confirm = (body.confirm || "").trim();
  if (confirm !== firm.name) {
    return errorResponse(`To confirm, type the firm name exactly: “${firm.name}”.`, 400);
  }

  // Orphan-free: audit logs aren't FK-linked, so clear them first, then delete the
  // organization (cascades firm → all firm data → users).
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { firmId: ctx.firmId } }),
    prisma.organization.delete({ where: { id: ctx.organizationId } }),
  ]);

  return successResponse({ closed: true });
}
