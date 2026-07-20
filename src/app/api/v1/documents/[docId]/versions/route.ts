import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { addDocumentVersion } from "@/lib/document-pipeline";
import { MAX_FILE_BYTES } from "@/lib/storage";

export const runtime = "nodejs";

/** Upload a new version of an existing document. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { docId } = await params;

  const doc = await prisma.document.findFirst({ where: { id: docId, firmId: ctx.firmId }, select: { id: true } });
  if (!doc) return errorResponse("Document not found", 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("Expected multipart/form-data upload", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return errorResponse("No file provided", 400);
  if (file.size > MAX_FILE_BYTES) {
    return errorResponse(`File exceeds the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB limit`, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const version = await addDocumentVersion({
      documentId: docId,
      firmId: ctx.firmId,
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      uploadedBy: ctx.userId,
    });
    return successResponse(version, 201);
  } catch (error) {
    console.error("Add version error:", error);
    return errorResponse("Failed to add version", 500);
  }
}
