import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { errorResponse } from "@/lib/api/response";
import { readFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string; versionId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const { docId, versionId } = await params;

  // Ownership check via the parent document's firm.
  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId: docId, document: { firmId: ctx.firmId } },
    select: { fileName: true, mimeType: true, data: true, storageKey: true },
  });
  if (!version) return errorResponse("File not found", 404);

  let buffer: Buffer;
  try {
    buffer = await readFile({ storageKey: version.storageKey, data: version.data });
  } catch {
    return errorResponse("File data unavailable", 500);
  }

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": version.mimeType || "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(version.fileName)}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
