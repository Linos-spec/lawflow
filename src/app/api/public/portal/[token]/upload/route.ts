import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createDocument } from "@/lib/document-pipeline";
import { MAX_FILE_BYTES } from "@/lib/storage";
import { PORTAL_CLIENT_UPLOADER } from "@/lib/portal";

export const runtime = "nodejs";

/** Public: a client uploads a document from their portal link (no login). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const matter = await prisma.case.findFirst({
    where: { portalToken: token, portalEnabled: true },
    select: { id: true, firmId: true },
  });
  if (!matter) return errorResponse("This portal link is not active", 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("Expected a file upload", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return errorResponse("No file provided", 400);
  if (file.size === 0) return errorResponse("The file is empty", 400);
  if (file.size > MAX_FILE_BYTES) {
    return errorResponse(`File exceeds the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB limit`, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const doc = await createDocument({
      firmId: matter.firmId,
      buffer,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      title: `Client upload — ${file.name}`,
      caseId: matter.id,
      uploadedBy: PORTAL_CLIENT_UPLOADER,
    });
    return successResponse({ id: doc.id, title: doc.title }, 201);
  } catch (error) {
    console.error("Portal upload error:", error);
    return errorResponse("Could not process the file. Please try again.", 500);
  }
}
