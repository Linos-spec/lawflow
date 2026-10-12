import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { POLICY_VERSION } from "@/lib/policies";
import { mintSetPasswordToken, setPasswordLink, sendSetPasswordEmail } from "@/lib/invite-email";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** Approve (provision a firm + invite) or decline an access request. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePlatformAdmin();
  if (!admin) return errorResponse("Not authorized", 403);
  const { id } = await params;

  let body: { action?: string };
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }

  const reqRow = await prisma.accessRequest.findUnique({ where: { id } });
  if (!reqRow) return errorResponse("Request not found", 404);
  if (reqRow.status !== "PENDING") return errorResponse(`This request was already ${reqRow.status.toLowerCase()}.`, 409);

  if (body.action === "decline") {
    await prisma.accessRequest.update({ where: { id }, data: { status: "DECLINED", reviewedAt: new Date(), reviewedBy: admin } });
    return successResponse({ status: "DECLINED" });
  }

  if (body.action === "approve") {
    const email = reqRow.email.toLowerCase();
    const dupe = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (dupe) return errorResponse("A user with this email already exists — can't provision a new firm.", 409);

    // Provision org + firm + admin user (mirrors the old open-signup path, now gated).
    const randomPw = await hash(crypto.randomBytes(24).toString("hex"), 12);
    const { firm, user } = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: reqRow.firmName } });
      const firm = await tx.firm.create({
        data: {
          name: reqRow.firmName,
          organizationId: organization.id,
          trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
          termsAcceptedAt: reqRow.createdAt,       // they accepted when requesting
          termsVersion: POLICY_VERSION,
          termsAcceptedByEmail: email,
        },
      });
      const user = await tx.user.create({
        data: { name: reqRow.name, email, hashedPassword: randomPw, role: "ADMIN", organizationId: organization.id, firmId: firm.id },
      });
      await tx.accessRequest.update({ where: { id }, data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: admin, firmId: firm.id } });
      return { firm, user };
    });

    // Email the new admin a set-password invite.
    const raw = await mintSetPasswordToken(user.id, 7);
    const invited = await sendSetPasswordEmail({
      to: email,
      name: reqRow.name,
      link: setPasswordLink(raw),
      subject: "Your Linoscore Legal access is approved",
      intro: `Your firm "${reqRow.firmName}" is approved on Linoscore Legal, with a 14-day free trial.`,
      ttlDays: 7,
    });

    await logAudit({
      firmId: firm.id, action: "platform.firm_provisioned", category: "config",
      entity: "Firm", entityId: firm.id, entityLabel: firm.name,
      details: `Access request approved by ${admin}${invited ? "" : " (invite email failed — share set-password link manually)"}`,
    });

    return successResponse({ status: "APPROVED", firmId: firm.id, inviteSent: invited, inviteLink: invited ? undefined : setPasswordLink(raw) });
  }

  return errorResponse("Unknown action", 400);
}
