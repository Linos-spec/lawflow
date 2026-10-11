import { NextRequest } from "next/server";
import crypto from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";
import { sendEmail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";
import { can, ROLE_LABELS, type Role } from "@/lib/rbac";
import { syncSeatQuantity } from "@/lib/stripe";

export const runtime = "nodejs";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

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
  const role = (body?.role as Role) || "ASSOCIATE";

  if (!name || !email) return errorResponse("Name and email are required", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse("Enter a valid email", 400);
  if (!ROLES.includes(role)) return errorResponse("Invalid role", 400);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return errorResponse("That email is already in use", 409);

  // The invitee sets their own password via the emailed link; until then the
  // account has an unguessable random password so it can't be signed into.
  const hashedPassword = await hash(crypto.randomBytes(24).toString("hex"), 12);
  const user = await prisma.user.create({
    data: { name, email, hashedPassword, role, organizationId: ctx.organizationId, firmId: ctx.firmId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await logAudit({
    firmId: ctx.firmId, userId: ctx.userId, action: "user.create", category: "access",
    entity: "User", entityId: user.id, entityLabel: user.name,
    details: `Invited ${name} (${email}) as ${ROLE_LABELS[role]}`,
  });

  await syncSeatQuantity(ctx.firmId); // keep the subscription quantity in step

  // Mint a set-password token (reuses the reset system) and email an invite.
  const raw = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  const link = `${publicBaseUrl(req).replace(/\/$/, "")}/reset-password?token=${raw}`;

  const firm = await prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { name: true } });
  const firmName = firm?.name || "your firm";
  const { delivered } = await sendEmail({
    to: email,
    subject: `You've been invited to ${firmName} on Linoscore Legal`,
    text: `Hi ${name},\n\nYou've been added to ${firmName} on Linoscore Legal as ${ROLE_LABELS[role]}. Set your password to get started (this link is valid for 7 days):\n\n${link}\n\nAfter setting your password, sign in at https://legal.linoscore.com/login.\n\n— Linoscore Legal`,
    html: `<p>Hi ${escapeHtml(name)},</p>
<p>You've been added to <b>${escapeHtml(firmName)}</b> on Linoscore Legal as <b>${escapeHtml(ROLE_LABELS[role])}</b>. Set your password to get started — this link is valid for 7 days:</p>
<p><a href="${link}" style="display:inline-block;background:#C8A24B;color:#111;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Set your password</a></p>
<p>Or paste this into your browser:<br><span style="color:#555">${link}</span></p>
<p style="color:#777;font-size:13px">Afterwards, sign in at https://legal.linoscore.com/login.</p>
<p style="color:#777;font-size:13px">— Linoscore Legal</p>`,
  });

  // If email didn't go out (mailer down), hand the admin the link to share manually.
  return successResponse({ ...user, inviteSent: delivered, inviteLink: delivered ? undefined : link }, 201);
}
