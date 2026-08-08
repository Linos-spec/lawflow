import { prisma } from "@/lib/prisma";
import { runConflictCheck } from "@/lib/conflict-check";
import { qualifyLead } from "@/lib/lead-qualification";
import { logIntakeEvent } from "@/lib/intake-events";
import type { CaseType, LeadSource, ClientType, ContactMethod } from "@prisma/client";

/**
 * The intake "brain": turns raw intake input (from any channel — web, phone,
 * referral) into a qualified, conflict-checked Lead. Build once, reuse per
 * channel. Runs the conflict check first (deterministic, always) then AI
 * qualification (best-effort; skipped gracefully if the AI key is unset).
 */
export async function createLeadFromIntake(input: {
  firmId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  caseType?: CaseType;
  description?: string | null;
  adverseParties?: string[];
  answers?: Record<string, unknown> | null;
  // Minimum intake profile
  clientType?: ClientType;
  preferredName?: string | null;
  preferredContactMethod?: ContactMethod;
  addressOrJurisdiction?: string | null;
  referralSource?: string | null;
  consultationPreference?: string | null;
  importantDates?: string | null;
  consentToContact?: boolean;
}) {
  const adverseParties = (input.adverseParties || [])
    .map((p) => p.trim())
    .filter(Boolean);

  // 1) Create the lead in NEW stage.
  const lead = await prisma.lead.create({
    data: {
      firmId: input.firmId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      source: input.source,
      caseType: input.caseType || "OTHER",
      description: input.description || null,
      adverseParties,
      answers: (input.answers as object) ?? undefined,
      clientType: input.clientType || "INDIVIDUAL",
      preferredName: input.preferredName || null,
      preferredContactMethod: input.preferredContactMethod || null,
      addressOrJurisdiction: input.addressOrJurisdiction || null,
      referralSource: input.referralSource || null,
      consultationPreference: input.consultationPreference || null,
      importantDates: input.importantDates || null,
      consentToContact: input.consentToContact ?? false,
      stage: "NEW",
      intakeStatus: "AI_PROCESSING",
      conflictStatus: "PENDING",
    },
  });

  await logIntakeEvent(prisma, {
    leadId: lead.id, firmId: input.firmId, type: "received", actorLabel: "System",
    toStatus: "NEW", note: `Intake received via ${input.source.toLowerCase()}`,
  });

  // 2) Deterministic conflict check (always runs). Exclude the lead we just
  // created so it doesn't match itself.
  const conflict = await runConflictCheck({
    firmId: input.firmId,
    name: input.name,
    adverseParties,
    excludeLeadId: lead.id,
  });

  await prisma.conflictCheck.create({
    data: {
      firmId: input.firmId,
      leadId: lead.id,
      status: conflict.status,
      searchedNames: conflict.searchedNames,
      matches: conflict.matches,
      matchCount: conflict.matchCount,
    },
  });

  // 3) AI qualification (best-effort).
  const qualification = await qualifyLead({
    name: input.name,
    caseType: input.caseType,
    description: input.description,
    adverseParties,
    answers: input.answers,
  });

  await logIntakeEvent(prisma, {
    leadId: lead.id, firmId: input.firmId, type: "conflict_checked", actorLabel: "System",
    note: conflict.matchCount > 0
      ? `Conflict check: ${conflict.matchCount} potential match(es) — ${conflict.status.toLowerCase()}`
      : "Conflict check: no matches found",
  });

  // 4) Roll everything up onto the lead and advance to human review.
  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      conflictStatus: conflict.status,
      stage: "QUALIFYING",
      intakeStatus: "NEEDS_REVIEW",
      ...(qualification
        ? {
            qualified: qualification.qualified,
            qualificationScore: qualification.qualificationScore,
            caseType: qualification.suggestedCaseType,
            aiPriority: qualification.priority,
            aiSummary: qualification.summary,
            aiRiskFlags: qualification.riskFlags,
            aiNextSteps: qualification.nextSteps,
            retainerStructure: qualification.retainer.structure,
            retainerAmountLow: qualification.retainer.amountLow,
            retainerAmountHigh: qualification.retainer.amountHigh,
            retainerRationale: qualification.retainer.rationale,
          }
        : {}),
    },
  });

  await logIntakeEvent(prisma, {
    leadId: lead.id, firmId: input.firmId, type: "ai_processed",
    actorLabel: qualification ? "AI" : "System",
    fromStatus: "AI_PROCESSING", toStatus: "NEEDS_REVIEW",
    note: qualification
      ? `AI review complete — ${qualification.qualified ? "looks qualified" : "needs attention"} (score ${qualification.qualificationScore}). Ready for human review.`
      : "AI unavailable — routed straight to human review.",
  });

  return { lead: updated, conflict, qualification };
}
