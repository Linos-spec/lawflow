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
    if (result.mode === "link-only") {
      // Token was valid, but the account's Calendly plan can't use webhooks.
      await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "firm.update", category: "config", entity: "Firm", entityId: ctx.firmId, entityLabel: "Calendly", details: `Calendly booking link set (${result.name}); auto-sync unavailable on current plan` });
      return successResponse({
        connected: false,
        linkOnly: true,
        name: result.name,
        message: "Your Calendly booking link is set, so clients can self-book. Auto-syncing booked meetings into your calendar needs a Calendly Standard plan or higher — upgrade, then reconnect to turn it on.",
      });
    }
    await logAudit({ firmId: ctx.firmId, userId: ctx.userId, action: "firm.update", category: "config", entity: "Firm", entityId: ctx.firmId, entityLabel: "Calendly", details: `Connected Calendly account (${result.name})` });
    return successResponse({ connected: true, name: result.name });
  } catch (err) {
    console.error("Calendly connect failed:", err);
    // Reaching here means the token itself was rejected (validation call failed).
    return errorResponse("Couldn't connect to Calendly. Check that this is a valid Calendly personal access token and try again.", 400);
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
