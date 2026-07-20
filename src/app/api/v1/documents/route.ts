import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createDocument } from "@/lib/document-pipeline";
import { MAX_FILE_BYTES } from "@/lib/storage";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// Fields safe/light for list views (excludes the heavy extractedText + bytes).
const listSelect = {
  id: true, title: true, originalName: true, documentType: true, tags: true,
  signatureStatus: true, aiSummary: true, caseId: true, clientId: true,
  createdAt: true, updatedAt: true,
} satisfies Prisma.DocumentSelect;

export async function GET(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const type = sp.get("type") || "";
  const caseId = sp.get("caseId") || "";
  const clientId = sp.get("clientId") || "";
  const signature = sp.get("signature") || "";
  const tag = sp.get("tag") || "";

  const where: Prisma.DocumentWhereInput = {
    firmId: ctx.firmId,
    ...(type && { documentType: type as Prisma.DocumentWhereInput["documentType"] }),
    ...(caseId && { caseId }),
    ...(clientId && { clientId }),
    ...(signature && { signatureStatus: signature as Prisma.DocumentWhereInput["signatureStatus"] }),
    ...(tag && { tags: { has: tag } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { originalName: { contains: q, mode: "insensitive" } },
        { extractedText: { contains: q, mode: "insensitive" } },
        { aiSummary: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
      ],
    }),
  };

  const documents = await prisma.document.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: listSelect,
  });

  return successResponse(documents);
}

export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("Expected multipart/form-data upload", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse("No file provided", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return errorResponse(`File exceeds the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB limit`, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const title = (form.get("title") as string) || "";
  const caseId = (form.get("caseId") as string) || null;
  const clientId = (form.get("clientId") as string) || null;

  // Validate case/client belong to this firm (avoid cross-firm linking).
  if (caseId) {
    const c = await prisma.case.findFirst({ where: { id: caseId, firmId: ctx.firmId }, select: { id: true } });
    if (!c) return errorResponse("Case not found", 400);
  }
  if (clientId) {
    const c = await prisma.client.findFirst({ where: { id: clientId, firmId: ctx.firmId }, select: { id: true } });
    if (!c) return errorResponse("Client not found", 400);
  }

  try {
    const doc = await createDocument({
      firmId: ctx.firmId,
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      title,
      caseId,
      clientId,
      uploadedBy: ctx.userId,
    });
    return successResponse(doc, 201);
  } catch (error) {
    console.error("Document upload error:", error);
    return errorResponse("Failed to process document", 500);
  }
}
