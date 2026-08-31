import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { can, ROLE_LABELS, type Role } from "@/lib/rbac";
import { syncSeatQuantity } from "@/lib/stripe";

export const runtime = "nodejs";

const ROLES: Role[] = ["ADMIN", "PARTNER", "ASSOCIATE", "PARALEGAL"];

/** Team members of the current firm (for attorney / team pickers + Team & Roles). */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const users = await prisma.user.findMany({
    where: { firmId: ctx.firmId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  return successResponse(users);
}

/**
 * Add a teammate to the firm — admin only. Each user is a seat/license.
 * No mailer is wired yet, so the admin sets a temporary password and shares it;
 * the teammate signs in and changes it. (Upgrade to email invite links later.)
 */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (!can(ctx.role, "team.manage")) return errorResponse("Only an admin can add users.", 403);

  const body = await req.json().catch(() => null);
  const name = (body?.name || "").trim();
  const email = (body?.email || "").trim().toLowerCase();
  const password = body?.password || "";
  const role = (body?.role as Role) || "ASSOCIATE";

  if (!name || !email) return errorResponse("Name and email are required", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse("Enter a valid email", 400);
  if (!ROLES.includes(role)) return errorResponse("Invalid role", 400);
  if (typeof password !== "string" || password.length < 8) return errorResponse("Temporary password must be at least 8 characters", 400);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return errorResponse("That email is already in use", 409);

  const hashedPassword = await hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, hashedPassword, role, organizationId: ctx.organizationId, firmId: ctx.firmId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await logAudit({
    firmId: ctx.firmId, userId: ctx.userId, action: "user.create", category: "access",
    entity: "User", entityId: user.id, entityLabel: user.name,
    details: `Added ${name} (${email}) as ${ROLE_LABELS[role]}`,
  });

  await syncSeatQuantity(ctx.firmId); // keep the subscription quantity in step

  return successResponse(user, 201);
}
