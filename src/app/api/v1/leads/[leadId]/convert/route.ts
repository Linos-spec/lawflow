import { NextRequest } from "next/server";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { orchestrateConversion } from "@/lib/orchestrator";

export const runtime = "nodejs";

/**
 * Convert a qualified lead. Runs the Workflow Orchestrator: creates the client,
 * opens the matter, and drafts the initial deadline plan per the firm's AI setup.
 * Blocks conversion while a conflict is unresolved (attorney must waive first).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  const { leadId } = await params;

  try {
    const result = await orchestrateConversion(leadId, ctx.firmId);
    return successResponse(result, 201);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      return errorResponse(String((err as { message: string }).message), (err as { code: number }).code);
    }
    console.error("Convert/orchestrate error:", err);
    return errorResponse("Failed to convert lead", 500);
  }
}
