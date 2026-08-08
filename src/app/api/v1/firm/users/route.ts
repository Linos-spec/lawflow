import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse } from "@/lib/api/response";

export const runtime = "nodejs";

/** Team members of the current firm (for attorney / team pickers). */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const users = await prisma.user.findMany({
    where: { firmId: ctx.firmId },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  return successResponse(users);
}
