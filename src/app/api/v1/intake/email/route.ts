import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgFirmIds, unauthorizedResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createLeadFromIntake } from "@/lib/intake-pipeline";
import {
  firmIntakeAddress,
  parseFromHeader,
  composeIntakeDescription,
  buildAcknowledgment,
} from "@/lib/intake-email";

export const runtime = "nodejs";

/** GET — the caller firm's intake address (for the Intake Inbox UI). */
export async function GET() {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();
  const firm = await prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { publicId: true } });
  if (!firm) return errorResponse("Firm not found", 404);
  return successResponse({ address: firmIntakeAddress(firm.publicId) });
}

/**
 * POST — log an emailed inquiry by hand (paste From / Subject / Body). Runs the
 * same conflict-check + AI-qualification pipeline as the inbound webhook, so a
 * firm gets the capability today without wiring up an email provider or DNS.
 */
export async function POST(request: NextRequest) {
  const ctx = await getOrgFirmIds();
  if (!ctx || !ctx.firmId) return unauthorizedResponse();

  let body: { from?: string; subject?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const from = (body.from || "").trim();
  const message = (body.body || "").trim();
  if (!from && !message) return errorResponse("Provide at least the sender or a message", 400);

  const firm = await prisma.firm.findUnique({ where: { id: ctx.firmId }, select: { name: true } });
  const sender = parseFromHeader(from);
  if (!sender.name || sender.name === "Unknown sender") {
    if (!message) return errorResponse("Provide a sender name/email", 400);
  }

  const description = composeIntakeDescription(body.subject, message);

  const { lead, conflict } = await createLeadFromIntake({
    firmId: ctx.firmId,
    name: sender.name,
    email: sender.email,
    source: "EMAIL",
    description,
    answers: {
      channel: "email",
      loggedManually: true,
      fromRaw: from || null,
      subject: body.subject || null,
      receivedAt: new Date().toISOString(),
    },
    referralSource: "Email inquiry",
  });

  const acknowledgment = buildAcknowledgment({ firmName: firm?.name || "our firm", prospectName: sender.name });

  return successResponse({ leadId: lead.id, conflictStatus: conflict.status, acknowledgment }, 201);
}
