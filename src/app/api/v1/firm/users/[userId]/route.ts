import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { can, ROLE_LABELS, type Role } from "@/lib/rbac";

export const runtime = "nodejs";

const ROLES: Role[] = ["ADMIN", "PARTNER", "ASSOCIATE", "PARALEGAL"];

/** Change a team member's role — admin only, audit-logged, last-admin protected. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "team.manage")) return errorResponse("Only an admin can change roles.", 403);

  const { userId } = await params;
  const body = await request.json().catch(() => null);
  const role = body?.role as Role;
  if (!role || !ROLES.includes(role)) return errorResponse("Invalid role", 400);

  const target = await prisma.user.findFirst({ where: { id: userId, firmId: ctx.firmId }, select: { id: true, name: true, role: true } });
  if (!target) return errorResponse("Team member not found", 404);
  if (target.role === role) return successResponse({ role });

  // Never leave the firm without an admin.
  if (target.role === "ADMIN" && role !== "ADMIN") {
    const admins = await prisma.user.count({ where: { firmId: ctx.firmId, role: "ADMIN" } });
    if (admins <= 1) return errorResponse("Your firm must keep at least one admin.", 400);
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAudit({
    firmId: ctx.firmId, userId: ctx.userId, action: "user.role_change", category: "access",
    entity: "User", entityId: userId, entityLabel: target.name,
    details: `${ROLE_LABELS[target.role as Role]} → ${ROLE_LABELS[role]}`,
  });
  return successResponse({ role });
}

/** Remove a team member (frees the seat) — admin only, self/last-admin protected. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "team.manage")) return errorResponse("Only an admin can remove users.", 403);

  const { userId } = await params;
  if (userId === ctx.userId) return errorResponse("You can't remove your own account.", 400);

  const target = await prisma.user.findFirst({ where: { id: userId, firmId: ctx.firmId }, select: { id: true, name: true, role: true } });
  if (!target) return errorResponse("Team member not found", 404);

  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { firmId: ctx.firmId, role: "ADMIN" } });
    if (admins <= 1) return errorResponse("Your firm must keep at least one admin.", 400);
  }

  // Don't orphan recorded work — block if the user has logged time.
  const timeEntries = await prisma.timeEntry.count({ where: { userId } });
  if (timeEntries > 0) return errorResponse("This user has recorded time entries. Reassign or keep the account to preserve billing history.", 400);

  await prisma.user.delete({ where: { id: userId } });
  await logAudit({
    firmId: ctx.firmId, userId: ctx.userId, action: "user.remove", category: "access",
    entity: "User", entityId: userId, entityLabel: target.name,
    details: `Removed ${target.name} (${ROLE_LABELS[target.role as Role]})`,
  });
  return successResponse({ removed: true });
}
