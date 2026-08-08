import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";

/** Firm audit trail — admin only. Read-only; entries are never edited or deleted. */
export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "audit.view")) return errorResponse("Only an admin can view the audit log.", 403);

  const sp = request.nextUrl.searchParams;
  const category = sp.get("category") || "";
  const q = (sp.get("q") || "").trim();
  const limit = Math.min(300, parseInt(sp.get("limit") || "150"));

  const logs = await prisma.auditLog.findMany({
    where: {
      firmId: ctx.firmId,
      ...(category && { category }),
      ...(q && { OR: [
        { action: { contains: q, mode: "insensitive" } },
        { entityLabel: { contains: q, mode: "insensitive" } },
        { actorName: { contains: q, mode: "insensitive" } },
      ] }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, action: true, category: true, entity: true, entityLabel: true, details: true, actorName: true, createdAt: true },
  });

  return successResponse({ logs });
}
