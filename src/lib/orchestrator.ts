import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { matterPlanSchema, type MatterPlan } from "@/lib/validators/ai.schema";
import { createEngagementLetter } from "@/lib/engagement-letter";
import { immigrationStarterChecklist } from "@/lib/practice-areas/immigration";
import { instantiateWorkflow, builtInWorkflowFor } from "@/lib/workflow";
import type { CaseType, Priority } from "@prisma/client";

/**
 * Workflow Orchestrator — the connective spine of AI Employee mode.
 *
 * Turns a qualified lead into a real matter and drafts the initial work, per the
 * firm's automation setup. Everything it produces is attorney-verifiable, and a
 * lead with an unresolved conflict never becomes a client.
 */

function hasAiKey() {
  return !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-placeholder");
}

/** Starter deadlines for a matter type. Immigration (the beachhead vertical) uses
 * a curated, deterministic checklist; other types fall back to AI. [] without a key. */
export async function generateMatterPlan(input: { caseType: string; description: string | null }): Promise<MatterPlan["deadlines"]> {
  if (input.caseType === "IMMIGRATION") {
    return immigrationStarterChecklist();
  }
  if (!hasAiKey()) return [];
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: matterPlanSchema,
      system: `You are a senior legal paralegal for Linos Legal. For a new ${input.caseType} matter, list the initial deadlines and tasks a competent firm opens on day one. Be specific to the matter type. These are SUGGESTIONS the supervising attorney must verify against jurisdiction rules — never present them as authoritative filing dates.`,
      prompt: `Matter type: ${input.caseType}\nDescription: ${input.description || "Not provided"}`,
    });
    return object.deadlines;
  } catch (err) {
    console.error("Matter plan generation failed:", err);
    return [];
  }
}

async function nextCaseNumber(firmId: string): Promise<string> {
  const count = await prisma.case.count({ where: { firmId } });
  const year = new Date().getFullYear();
  return `${year}-${String(count + 1).padStart(4, "0")}`;
}

export type OrchestrationResult = {
  client: { id: string; name: string };
  matter: { id: string; caseNumber: string; title: string } | null;
  deadlinesCreated: number;
  tasksCreated: number;
  engagementLetterId: string | null;
};

/**
 * Full intake→matter orchestration for a converted lead. Respects the firm's
 * aiAutoCreateMatter / aiAutoGenerateTasks setup.
 * Throws { code, message } for guard failures so the route maps them to status codes.
 */
export async function orchestrateConversion(leadId: string, firmId: string): Promise<OrchestrationResult> {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, firmId } });
  if (!lead) throw { code: 404, message: "Lead not found" };
  if (lead.convertedClientId) throw { code: 409, message: "This lead has already been converted" };
  // Ethics guard: an unresolved conflict never becomes a client.
  if (lead.conflictStatus === "CONFLICT") {
    throw { code: 409, message: "This lead has an unresolved conflict of interest. An attorney must review and waive it before converting." };
  }

  const firm = await prisma.firm.findUniqueOrThrow({
    where: { id: firmId },
    select: { name: true, aiAutoCreateMatter: true, aiAutoGenerateTasks: true, aiAutoEngagementLetter: true },
  });

  const client = await prisma.client.create({
    data: {
      firmId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      clientType: "INDIVIDUAL",
      notes: lead.description ? `Converted from lead. Original inquiry: ${lead.description}` : "Converted from lead.",
    },
  });

  let matter: OrchestrationResult["matter"] = null;
  let deadlinesCreated = 0;
  let tasksCreated = 0;
  let engagementLetterId: string | null = null;

  if (firm.aiAutoCreateMatter) {
    const caseNumber = await nextCaseNumber(firmId);
    const created = await prisma.case.create({
      data: {
        firmId,
        clientId: client.id,
        caseNumber,
        title: `${lead.name} — ${lead.caseType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}`,
        caseType: lead.caseType as CaseType,
        description: lead.description || lead.aiSummary || null,
        priority: (lead.aiPriority as Priority) || "MEDIUM",
        status: "OPEN",
        notes: "Opened by AI Employee from converted lead. Details AI-filled — verify.",
      },
    });
    matter = { id: created.id, caseNumber: created.caseNumber, title: created.title };

    if (firm.aiAutoGenerateTasks) {
      const plan = await generateMatterPlan({ caseType: lead.caseType, description: lead.description });
      if (plan.length) {
        const now = Date.now();
        await prisma.deadline.createMany({
          data: plan.map((d) => ({
            firmId,
            caseId: created.id,
            title: d.title,
            description: `AI-suggested (${d.rationale}) — verify against jurisdiction rules.`,
            dueDate: new Date(now + d.dueInDays * 86_400_000),
            deadlineType: d.deadlineType,
            priority: d.priority,
            status: "PENDING" as const,
          })),
        });
        deadlinesCreated = plan.length;
      }

      // Instantiate the practice-area workflow → real Tasks with relative deadlines,
      // approval gates, and (once assigned) ownership. The operational engine.
      const steps = builtInWorkflowFor(lead.caseType);
      if (steps) {
        tasksCreated = await instantiateWorkflow({ firmId, caseId: created.id, steps, openDate: new Date() });
      }
    }

    // Automatic engagement letter — drafted to the new matter, awaiting signature.
    if (firm.aiAutoEngagementLetter) {
      try {
        const letter = await createEngagementLetter({
          firmId,
          firmName: firm.name,
          clientId: client.id,
          caseId: created.id,
          clientName: lead.name,
          matterType: lead.caseType,
          matterDescription: lead.description,
          retainer: {
            structure: lead.retainerStructure,
            amountLow: lead.retainerAmountLow,
            amountHigh: lead.retainerAmountHigh,
          },
        });
        engagementLetterId = letter?.id ?? null;
      } catch (err) {
        console.error("Engagement letter auto-draft failed (non-fatal):", err);
      }
    }
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { stage: "CONVERTED", convertedClientId: client.id, convertedCaseId: matter?.id ?? null },
  });

  return { client: { id: client.id, name: client.name }, matter, deadlinesCreated, tasksCreated, engagementLetterId };
}
