import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createLeadFromIntake } from "@/lib/intake-pipeline";
import {
  firmTokenFromAddress,
  parseFromHeader,
  composeIntakeDescription,
  buildAcknowledgment,
} from "@/lib/intake-email";
import { translateToEnglish } from "@/lib/translate";

export const runtime = "nodejs";

/**
 * Public inbound-email webhook for the firm Intake Inbox.
 *
 * Provider-agnostic: an email provider's inbound-parse feature (SendGrid Inbound
 * Parse, Mailgun Routes, Postmark inbound) POSTs a parsed message here. We accept
 * a normalized JSON body and also tolerate common provider field names, whether
 * sent as JSON or multipart/form-data:
 *   to/recipient      — the firm's intake-<publicId>@... address (identifies the firm)
 *   from/sender       — the prospective client
 *   subject
 *   text/body-plain/body/plain
 *
 * Security (MVP): if INTAKE_WEBHOOK_SECRET is set, callers must present it via
 * ?secret= or the x-intake-secret header. Left open otherwise so it works before
 * a provider is wired up — add the secret + rate limiting before heavy prod use.
 * Like the public intake form, this creates records without a user session.
 */

function pick(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

export async function POST(request: NextRequest) {
  // Optional shared-secret gate.
  const required = process.env.INTAKE_WEBHOOK_SECRET;
  if (required) {
    const provided = request.nextUrl.searchParams.get("secret") || request.headers.get("x-intake-secret");
    if (provided !== required) return errorResponse("Unauthorized", 401);
  }

  // Parse either JSON or form-encoded provider payloads.
  let payload: Record<string, unknown> = {};
  const ctype = request.headers.get("content-type") || "";
  try {
    if (ctype.includes("application/json")) {
      payload = (await request.json()) as Record<string, unknown>;
    } else {
      const form = await request.formData();
      for (const [k, v] of form.entries()) payload[k] = typeof v === "string" ? v : "";
    }
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const to = pick(payload, "to", "recipient", "To");
  const from = pick(payload, "from", "sender", "From");
  const subject = pick(payload, "subject", "Subject");
  const body = pick(payload, "text", "body-plain", "body", "plain", "stripped-text");

  const token = firmTokenFromAddress(to);
  if (!token) return errorResponse("Recipient is not a valid intake address", 422);

  const firm = await prisma.firm.findUnique({ where: { publicId: token }, select: { id: true, name: true } });
  if (!firm) return errorResponse("Intake address not found", 404);

  const sender = parseFromHeader(from);
  let description = composeIntakeDescription(subject, body);

  // Multilingual: translate the body to English for the firm, keep the original.
  let answers: Record<string, unknown> = {
    channel: "email",
    fromRaw: from || null,
    subject: subject || null,
    receivedAt: new Date().toISOString(),
  };
  const translated = await translateToEnglish(description).catch(() => null);
  if (translated && translated.trim() && translated.trim() !== description.trim()) {
    answers = { ...answers, originalMessage: description };
    description = translated;
  }

  const { lead, conflict } = await createLeadFromIntake({
    firmId: firm.id,
    name: sender.name,
    email: sender.email,
    source: "EMAIL",
    description,
    answers,
    referralSource: "Email inquiry",
  });

  const acknowledgment = buildAcknowledgment({ firmName: firm.name, prospectName: sender.name });

  // No outbound mailer is configured yet, so we return the acknowledgment for
  // the provider/staff to send. Once a sender is wired in, dispatch it here.
  return successResponse(
    {
      received: true,
      leadId: lead.id,
      conflictStatus: conflict.status,
      acknowledgment,
    },
    201
  );
}
