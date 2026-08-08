import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { docId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: docId, firmId: ctx.firmId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        select: { id: true, versionNumber: true, fileName: true, mimeType: true, size: true, uploadedBy: true, createdAt: true },
      },
      case: { select: { id: true, title: true, caseNumber: true } },
      client: { select: { id: true, name: true } },
    },
  });

  if (!doc) return errorResponse("Document not found", 404);
  return successResponse(doc);
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  documentType: z.enum([
    "CONTRACT", "PLEADING", "COURT_FILING", "CORRESPONDENCE", "EVIDENCE",
    "DISCOVERY", "INVOICE", "IDENTIFICATION", "ENGAGEMENT_LETTER", "MEMO", "OTHER",
  ]).optional(),
  tags: z.array(z.string()).optional(),
  signatureStatus: z.enum(["NOT_REQUIRED", "PENDING", "SIGNED"]).optional(),
  caseId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { docId } = await params;

  const existing = await prisma.document.findFirst({ where: { id: docId, firmId: ctx.firmId }, select: { id: true } });
  if (!existing) return errorResponse("Document not found", 404);

  try {
    const input = updateSchema.parse(await request.json());
    const updated = await prisma.document.update({ where: { id: docId }, data: input });
    return successResponse(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return errorResponse("Validation failed", 400);
    return errorResponse("Failed to update document", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { docId } = await params;

  const existing = await prisma.document.findFirst({ where: { id: docId, firmId: ctx.firmId }, select: { id: true, title: true } });
  if (!existing) return errorResponse("Document not found", 404);

  await prisma.document.delete({ where: { id: docId } });
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "document.delete", entity: "Document", entityId: docId, entityLabel: existing.title });
  return successResponse({ deleted: true });
}
