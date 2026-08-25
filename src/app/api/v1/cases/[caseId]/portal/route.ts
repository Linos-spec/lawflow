import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";
import { logAudit } from "@/lib/audit";
import { hashPin } from "@/lib/portal-access";

export const runtime = "nodejs";

function portalUrl(req: NextRequest, token: string) {
  const origin = publicBaseUrl(req);
  return `${origin}/portal/${token}`;
}

/** Current portal state + link for a matter. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { portalEnabled: true, portalToken: true, portalPinHash: true, portalExpiresAt: true } });
  if (!c) return errorResponse("Matter not found", 404);
  return successResponse({
    portalEnabled: c.portalEnabled,
    portalUrl: c.portalToken && c.portalEnabled ? portalUrl(req, c.portalToken) : null,
    pinSet: !!c.portalPinHash,
    expiresAt: c.portalExpiresAt ? c.portalExpiresAt.toISOString() : null,
  });
}

/** Update portal access controls: set/clear an access PIN and/or link expiry. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { portalToken: true, title: true, caseNumber: true } });
  if (!c || !c.portalToken) return errorResponse("Enable the portal first", 400);

  let body: { pin?: string | null; expiresAt?: string | null };
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }

  const data: { portalPinHash?: string | null; portalExpiresAt?: Date | null } = {};
  const changes: string[] = [];

  if (body.pin !== undefined) {
    const pin = (body.pin || "").trim();
    if (pin === "") { data.portalPinHash = null; changes.push("PIN removed"); }
    else if (!/^\d{4,8}$/.test(pin)) { return errorResponse("PIN must be 4–8 digits", 400); }
    else { data.portalPinHash = hashPin(c.portalToken, pin); changes.push("PIN set"); }
  }
  if (body.expiresAt !== undefined) {
    if (!body.expiresAt) { data.portalExpiresAt = null; changes.push("expiry removed"); }
    else {
      const d = new Date(body.expiresAt);
      if (isNaN(d.getTime())) return errorResponse("Invalid expiry date", 400);
      data.portalExpiresAt = d; changes.push(`expires ${d.toISOString().slice(0, 10)}`);
    }
  }
  if (Object.keys(data).length === 0) return errorResponse("Nothing to update", 400);

  await prisma.case.update({ where: { id: caseId }, data });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "portal.access_update", category: "access", entity: "Case", entityId: caseId, entityLabel: `${c.caseNumber} · ${c.title}`, details: `Portal access: ${changes.join(", ")}` });

  const updated = await prisma.case.findUnique({ where: { id: caseId }, select: { portalPinHash: true, portalExpiresAt: true } });
  return successResponse({ pinSet: !!updated?.portalPinHash, expiresAt: updated?.portalExpiresAt ? updated.portalExpiresAt.toISOString() : null });
}

/** Enable the client portal for this matter (generates the token if needed). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { portalToken: true, title: true, caseNumber: true } });
  if (!c) return errorResponse("Matter not found", 404);

  const token = c.portalToken || randomUUID();
  await prisma.case.update({ where: { id: caseId }, data: { portalEnabled: true, portalToken: token } });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "portal.enable", category: "access", entity: "Case", entityId: caseId, entityLabel: `${c.caseNumber} · ${c.title}`, details: "Client portal enabled — matter data exposed via shareable link" });
  return successResponse({ portalEnabled: true, portalUrl: portalUrl(req, token) });
}

/** Turn the portal off (keeps the token so re-enabling reuses the same link). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true, title: true, caseNumber: true } });
  if (!c) return errorResponse("Matter not found", 404);
  await prisma.case.update({ where: { id: caseId }, data: { portalEnabled: false } });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "portal.disable", category: "access", entity: "Case", entityId: caseId, entityLabel: `${c.caseNumber} · ${c.title}`, details: "Client portal turned off" });
  return successResponse({ portalEnabled: false });
}
