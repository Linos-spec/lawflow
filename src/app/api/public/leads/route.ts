import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api/response";
import { publicLeadSchema } from "@/lib/validators/public-lead.schema";
import { createLeadFromIntake } from "@/lib/intake-pipeline";
import { translateToEnglish } from "@/lib/translate";

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

  // Multilingual intake: if submitted in another language, translate the
  // description to English for the firm and keep the original in `answers`.
  const lang = (input.intakeLanguage || "en").toLowerCase();
  let description = input.description || null;
  let answers: Record<string, unknown> | null = input.answers ?? null;
  if (lang !== "en" && description) {
    const translated = await translateToEnglish(description);
    if (translated) {
      answers = { ...(answers || {}), intakeLanguage: lang, originalDescription: description };
      description = translated;
    } else {
      answers = { ...(answers || {}), intakeLanguage: lang };
    }
  }

  try {
    const { lead, conflict } = await createLeadFromIntake({
      firmId: firm.id,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      source: "WEBSITE",
      caseType: input.caseType,
      description,
      adverseParties: input.adverseParties,
      answers,
      clientType: input.clientType,
      preferredName: input.preferredName || null,
      preferredContactMethod: input.preferredContactMethod,
      addressOrJurisdiction: input.addressOrJurisdiction || null,
      referralSource: input.referralSource || null,
      consultationPreference: input.consultationPreference || null,
      importantDates: input.importantDates || null,
      consentToContact: input.consentToContact ?? false,
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
