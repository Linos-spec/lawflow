import { NextRequest } from "next/server";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { runConflictCheck } from "@/lib/conflict-check";

export const runtime = "nodejs";

/** Ad-hoc conflict check for a name (+ adverse parties) — used during case intake. */
export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const body = await request.json().catch(() => null);
  const name = (body?.name || "").trim();
  if (!name) return errorResponse("A name is required", 400);
  const adverseParties = Array.isArray(body?.adverseParties) ? body.adverseParties : [];

  const result = await runConflictCheck({ firmId: ctx.firmId, name, adverseParties });
  return successResponse({
    status: result.status,
    matchCount: result.matchCount,
    matches: result.matches,
  });
}
