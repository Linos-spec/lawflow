import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicLeadSchema } from "@/lib/validators/public-lead.schema";
import { createLeadFromIntake } from "@/lib/intake-pipeline";

/**
 * Public: a prospective client submits the intake questionnaire.
 * Unauthenticated — the firm is identified by its opaque publicId.
 *
 * Note (MVP): this endpoint is open by design. Before heavy production use,
 * add rate limiting / spam protection (e.g. per-IP throttle + captcha) since
 * it creates records without auth.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400);
  }

  const parsed = publicLeadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message || "Validation failed", 400);
  }
  const input = parsed.data;

  // Resolve the firm from its public intake id.
  const firm = await prisma.firm.findUnique({
    where: { publicId: input.publicId },
    select: { id: true },
  });
  if (!firm) {
    return errorResponse("Intake link not found", 404);
  }

  try {
    const { lead, conflict } = await createLeadFromIntake({
      firmId: firm.id,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      source: "WEBSITE",
      caseType: input.caseType,
      description: input.description || null,
      adverseParties: input.adverseParties,
      answers: input.answers ?? null,
    });

    // Only confirm receipt to the prospect — never leak conflict/qualification.
    return successResponse(
      { leadId: lead.id, received: true, conflictRan: conflict.status !== "PENDING" },
      201
    );
  } catch (error) {
    console.error("Public lead intake error:", error);
    return errorResponse("Something went wrong submitting your request", 500);
  }
}
