import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { generateSecret, keyUri, verifyTotp, generateBackupCodes, hashBackupCode } from "@/lib/mfa";

export const runtime = "nodejs";

/** GET — current 2FA state for the signed-in user + whether the firm requires it. */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx) return unauthorizedResponse();
  const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { mfaEnabled: true, mfaBackupCodes: true } });
  const firm = ctx.firmId ? await prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { mfaRequired: true } }) : null;
  return successResponse({
    mfaEnabled: !!user?.mfaEnabled,
    backupCodesRemaining: user?.mfaBackupCodes.length ?? 0,
    firmRequired: !!firm?.mfaRequired,
    isAdmin: ctx.role === "ADMIN",
  });
}

/**
 * POST — actions: { action: "setup" | "enable" | "disable", token? }
 *  setup   → generates a pending secret, returns otpauth URI + QR (not yet enabled)
 *  enable  → verifies the first code, enables 2FA, returns one-time backup codes
 *  disable → verifies a current code, then turns 2FA off
 */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx) return unauthorizedResponse();

  let body: { action?: string; token?: string };
  try { body = await req.json(); } catch { return errorResponse("Invalid request", 400); }
  const action = body.action;
  const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { id: true, email: true, mfaEnabled: true, mfaSecret: true, mfaBackupCodes: true } });
  if (!user) return unauthorizedResponse();

  if (action === "setup") {
    const secret = generateSecret();
    await prisma.user.update({ where: { id: user.id }, data: { mfaSecret: secret, mfaEnabled: false } });
    const uri = keyUri(user.email, secret);
    const qrDataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
    return successResponse({ secret, otpauthUri: uri, qrDataUrl });
  }

  if (action === "enable") {
    if (!user.mfaSecret) return errorResponse("Start setup first", 400);
    const code = (body.token || "").trim();
    if (!verifyTotp(code, user.mfaSecret)) return errorResponse("That code didn't match. Check your authenticator app and try again.", 400);
    const { plain, hashed } = generateBackupCodes(10);
    await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true, mfaBackupCodes: hashed } });
    await logAudit({ firmId: ctx.firmId || "", userId: user.id, action: "user.mfa_enable", category: "auth", entity: "User", entityId: user.id, entityLabel: user.email, details: "Two-factor authentication enabled" });
    return successResponse({ enabled: true, backupCodes: plain });
  }

  if (action === "disable") {
    if (!user.mfaEnabled) return successResponse({ enabled: false });
    const code = (body.token || "").trim();
    const ok = user.mfaSecret ? verifyTotp(code, user.mfaSecret) : false;
    const backupOk = user.mfaBackupCodes.includes(hashBackupCode(code));
    if (!ok && !backupOk) return errorResponse("Enter a current 2FA code to turn it off.", 400);
    await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] } });
    await logAudit({ firmId: ctx.firmId || "", userId: user.id, action: "user.mfa_disable", category: "auth", entity: "User", entityId: user.id, entityLabel: user.email, details: "Two-factor authentication disabled" });
    return successResponse({ enabled: false });
  }

  return errorResponse("Unknown action", 400);
}
