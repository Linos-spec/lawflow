import { NextRequest } from "next/server";
import { getOrgFirmIds, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicBaseUrl } from "@/lib/base-url";
import { connectCalendly, disconnectCalendly } from "@/lib/calendly";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** Connect the firm's Calendly account with a personal access token. Admin only. */
export async function POST(req: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return forbiddenResponse();

  let body: { token?: string };
  try { body = await req.json(); } catch { return errorResponse("Invalid request body", 400); }
  const token = (body.token || "").trim();
  if (!token) return errorResponse("Enter your Calendly personal access token.", 400);

  try {
    const result = await connectCalendly(ctx.firmId, token, publicBaseUrl(req));
    await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "firm.update", category: "config", entity: "Firm", entityId: ctx.firmId, entityLabel: "Calendly", details: `Connected Calendly account (${result.name})` });
    return successResponse({ connected: true, name: result.name });
  } catch (err) {
    console.error("Calendly connect failed:", err);
    // Most failures are a bad/expired token or insufficient scope.
    return errorResponse("Couldn't connect to Calendly. Check that the token is a valid personal access token with webhook permissions.", 400);
  }
}

/** Disconnect the firm's Calendly account. Admin only. */
export async function DELETE() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  if (ctx.role !== "ADMIN") return forbiddenResponse();

  await disconnectCalendly(ctx.firmId);
  await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "firm.update", category: "config", entity: "Firm", entityId: ctx.firmId, entityLabel: "Calendly", details: "Disconnected Calendly account" });
  return successResponse({ connected: false });
}
