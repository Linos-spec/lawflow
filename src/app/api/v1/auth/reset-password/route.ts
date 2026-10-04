import { NextRequest } from "next/server";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** Complete a password reset: validate the one-time token and set the new password. */
export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
  try { body = await req.json(); } catch { return errorResponse("Invalid request", 400); }

  const raw = (body.token || "").trim();
  const password = body.password || "";
  if (!raw) return errorResponse("This reset link is invalid.", 400);
  if (password.length < 8) return errorResponse("Password must be at least 8 characters.", 400);

  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true, user: { select: { firmId: true, name: true } } },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return errorResponse("This reset link is invalid or has expired. Please request a new one.", 400);
  }

  const hashedPassword = await hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { hashedPassword } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate any other outstanding tokens for this user.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);

  if (record.user.firmId) {
    await logAudit({
      firmId: record.user.firmId, userId: record.userId, action: "auth.password_reset", category: "auth",
      entity: "User", entityId: record.userId, entityLabel: record.user.name, details: "Password reset via email link",
    });
  }

  return successResponse({ reset: true });
}
