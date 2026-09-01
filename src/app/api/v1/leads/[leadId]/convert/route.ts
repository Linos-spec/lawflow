import { NextRequest } from "next/server";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { orchestrateConversion } from "@/lib/orchestrator";
import { logAudit } from "@/lib/audit";

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
    const r = result as { case?: { id?: string; caseNumber?: string; title?: string } };
    await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "lead.convert", category: "data", entity: "Lead", entityId: leadId, entityLabel: r.case?.title || r.case?.caseNumber || "New matter", details: "Lead converted to a client + matter" });
    return successResponse(result, 201);
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      return errorResponse(String((err as { message: string }).message), (err as { code: number }).code);
    }
    console.error("Convert/orchestrate error:", err);
    return errorResponse("Failed to convert lead", 500);
  }
}
