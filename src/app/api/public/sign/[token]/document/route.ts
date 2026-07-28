import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api/response";
import { readFile } from "@/lib/storage";

export const runtime = "nodejs";

/** Public: stream the document being signed, gated by the signing token. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sr = await prisma.signatureRequest.findUnique({
    where: { token },
    select: { document: { select: { currentVersionId: true, originalName: true } } },
  });
  if (!sr) return errorResponse("Not found", 404);

  const versionId = sr.document.currentVersionId;
  if (!versionId) return errorResponse("Document unavailable", 404);

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    select: { fileName: true, mimeType: true, data: true, storageKey: true },
  });
  if (!version) return errorResponse("Document unavailable", 404);

  let buffer: Buffer;
  try {
    buffer = await readFile({ storageKey: version.storageKey, data: version.data });
  } catch {
    return errorResponse("Document unavailable", 500);
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": version.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(version.fileName)}"`,
    },
  });
}
