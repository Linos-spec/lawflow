import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";

/**
 * Public: resolve a firm's public intake link to its display name.
 * Unauthenticated — only exposes the firm name (no sensitive data).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;

  const firm = await prisma.firm.findUnique({
    where: { publicId },
    select: { name: true },
  });

  if (!firm) {
    return errorResponse("Intake link not found", 404);
  }

  return successResponse({ firmName: firm.name });
}
