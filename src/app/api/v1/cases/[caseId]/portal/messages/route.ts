import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";

export const runtime = "nodejs";

/** Firm view of a matter's portal message thread. Marks client messages read. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true } });
  if (!c) return errorResponse("Matter not found", 404);

  const messages = await prisma.portalMessage.findMany({
    where: { caseId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, sender: true, authorName: true, body: true, createdAt: true, readByFirm: true },
  });

  await prisma.portalMessage.updateMany({
    where: { caseId, sender: "CLIENT", readByFirm: false },
    data: { readByFirm: true },
  }).catch(() => {});

  return successResponse({
    messages: messages.map((m) => ({
      id: m.id, fromClient: m.sender === "CLIENT", authorName: m.authorName,
      body: m.body, createdAt: m.createdAt.toISOString(),
    })),
  });
}

/** Firm sends a reply into the portal thread. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { caseId } = await params;
  const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true } });
  if (!c) return errorResponse("Matter not found", 404);

  let body: { message?: string };
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }
  const text = (body.message || "").trim();
  if (!text) return errorResponse("Message is empty", 400);

  const author = ctx.userId ? await prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true } }) : null;

  const created = await prisma.portalMessage.create({
    data: {
      caseId, firmId: ctx.firmId, sender: "FIRM",
      authorName: author?.name || "Your firm",
      body: text.slice(0, 4000),
      readByFirm: true, readByClient: false,
    },
    select: { id: true, authorName: true, body: true, createdAt: true },
  });

  return successResponse({
    message: { id: created.id, fromClient: false, authorName: created.authorName, body: created.body, createdAt: created.createdAt.toISOString() },
  }, 201);
}
