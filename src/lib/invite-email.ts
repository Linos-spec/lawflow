import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

const APP_URL = "https://legal.linoscore.com";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/** Mint a single-use set-password/reset token for a user; returns the raw token. */
export async function mintSetPasswordToken(userId: string, ttlDays: number): Promise<string> {
  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + ttlDays * 86_400_000) },
  });
  return raw;
}

export function setPasswordLink(rawToken: string): string {
  return `${APP_URL}/reset-password?token=${rawToken}`;
}

/**
 * Send a "set your password" invite email. Used for team invites and for
 * approved access requests. Returns whether it was delivered.
 */
export async function sendSetPasswordEmail(opts: {
  to: string;
  name: string;
  link: string;
  subject: string;
  intro: string;      // one-line context, e.g. "You've been added to Acme Law as Admin."
  ttlDays: number;
}): Promise<boolean> {
  const { to, name, link, subject, intro, ttlDays } = opts;
  const { delivered } = await sendEmail({
    to,
    subject,
    text: `Hi ${name},\n\n${intro} Set your password to get started (link valid for ${ttlDays} days):\n\n${link}\n\nThen sign in at ${APP_URL}/login.\n\n— Linoscore Legal`,
    html: `<p>Hi ${escapeHtml(name)},</p>
<p>${escapeHtml(intro)} Set your password to get started — this link is valid for ${ttlDays} days:</p>
<p><a href="${link}" style="display:inline-block;background:#C8A24B;color:#111;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Set your password</a></p>
<p>Or paste this into your browser:<br><span style="color:#555">${link}</span></p>
<p style="color:#777;font-size:13px">Afterwards, sign in at ${APP_URL}/login.</p>
<p style="color:#777;font-size:13px">— Linoscore Legal</p>`,
  });
  return delivered;
}
