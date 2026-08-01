import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";

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
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { portalEnabled: true, portalToken: true } });
  if (!c) return errorResponse("Matter not found", 404);
  return successResponse({ portalEnabled: c.portalEnabled, portalUrl: c.portalToken && c.portalEnabled ? portalUrl(req, c.portalToken) : null });
}

/** Enable the client portal for this matter (generates the token if needed). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { portalToken: true } });
  if (!c) return errorResponse("Matter not found", 404);

  const token = c.portalToken || randomUUID();
  await prisma.case.update({ where: { id: caseId }, data: { portalEnabled: true, portalToken: token } });
  return successResponse({ portalEnabled: true, portalUrl: portalUrl(req, token) });
}

/** Turn the portal off (keeps the token so re-enabling reuses the same link). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true } });
  if (!c) return errorResponse("Matter not found", 404);
  await prisma.case.update({ where: { id: caseId }, data: { portalEnabled: false } });
  return successResponse({ portalEnabled: false });
}
