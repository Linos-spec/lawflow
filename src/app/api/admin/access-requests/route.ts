import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const runtime = "nodejs";

/** Platform-owner inbox of access requests. Filter by ?status= (default all). */
export async function GET(req: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) return errorResponse("Not authorized", 403);

  const status = new URL(req.url).searchParams.get("status");
  const requests = await prisma.accessRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, firmName: true, phone: true, message: true, status: true, createdAt: true, reviewedAt: true, reviewedBy: true, firmId: true },
  });
  const pendingCount = await prisma.accessRequest.count({ where: { status: "PENDING" } });

  return successResponse({
    pendingCount,
    requests: requests.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), reviewedAt: r.reviewedAt?.toISOString() ?? null })),
  });
}
