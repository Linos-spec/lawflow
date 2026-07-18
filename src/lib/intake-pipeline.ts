import { prisma } from "@/lib/prisma";
import { runConflictCheck } from "@/lib/conflict-check";
import { qualifyLead } from "@/lib/lead-qualification";
import type { CaseType, LeadSource } from "@prisma/client";

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
      stage: "NEW",
      conflictStatus: "PENDING",
    },
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

  // 4) Roll everything up onto the lead and advance the stage.
  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      conflictStatus: conflict.status,
      stage: "QUALIFYING",
      ...(qualification
        ? {
            qualified: qualification.qualified,
            qualificationScore: qualification.qualificationScore,
            caseType: qualification.suggestedCaseType,
            aiPriority: qualification.priority,
            aiSummary: qualification.summary,
            aiRiskFlags: qualification.riskFlags,
            aiNextSteps: qualification.nextSteps,
          }
        : {}),
    },
  });

  return { lead: updated, conflict, qualification };
}
