import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";
import { sendEmail } from "@/lib/mailer";

export const runtime = "nodejs";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Start a password reset. Always returns the same success (no account
 * enumeration). If the email matches a user, we create a single-use hashed
 * token and email the reset link; delivery failures are swallowed so the
 * response never reveals whether the address exists.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try { body = await req.json(); } catch { return ok(); }
  const email = (body.email || "").trim().toLowerCase();
  if (!email) return ok();

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (user) {
    try {
      // Invalidate any outstanding tokens for this user, then mint a fresh one.
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      const raw = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
      });

      const link = `${publicBaseUrl(req).replace(/\/$/, "")}/reset-password?token=${raw}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your Linoscore Legal password",
        text: `Hi ${user.name},\n\nWe received a request to reset your Linoscore Legal password. Use the link below within the next hour:\n\n${link}\n\nIf you didn't request this, you can safely ignore this email — your password won't change.\n\n— Linoscore Legal`,
        html: `<p>Hi ${escapeHtml(user.name)},</p>
<p>We received a request to reset your Linoscore Legal password. This link is valid for one hour:</p>
<p><a href="${link}" style="display:inline-block;background:#C8A24B;color:#111;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset your password</a></p>
<p>Or paste this into your browser:<br><span style="color:#555">${link}</span></p>
<p style="color:#777;font-size:13px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
<p style="color:#777;font-size:13px">— Linoscore Legal</p>`,
      });
    } catch (err) {
      // Never surface internal failures — keep the response identical.
      console.error("forgot-password error:", err);
    }
  }

  return ok();
}

function ok() {
  return successResponse({ sent: true });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
