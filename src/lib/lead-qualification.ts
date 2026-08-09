import { generateObject } from "ai";
import { aiModel } from "@/lib/ai";
import { leadQualificationSchema, type LeadQualification } from "@/lib/validators/ai.schema";

/**
 * AI qualification of an inbound lead. Produces a structured, advisory
 * assessment (score, suggested case type, priority, risk flags, next steps).
 * This informs the intake team — it does NOT make representation or conflict
 * decisions, which stay with an attorney.
 */
export async function qualifyLead(input: {
  name: string;
  caseType?: string | null;
  description?: string | null;
  adverseParties?: string[];
  answers?: Record<string, unknown> | null;
}): Promise<LeadQualification | null> {
  const context = `
INBOUND LEAD:
- Name: ${input.name}
- Stated matter type: ${input.caseType || "Not specified"}
- Description: ${input.description || "None provided"}
- Adverse / opposing parties: ${
    input.adverseParties && input.adverseParties.length
      ? input.adverseParties.join(", ")
      : "None provided"
  }
- Questionnaire answers: ${
    input.answers && Object.keys(input.answers).length
      ? JSON.stringify(input.answers, null, 2)
      : "None"
  }
  `.trim();

  try {
    const { object } = await generateObject({
      model: aiModel,
      schema: leadQualificationSchema,
      system: `You are a senior legal intake specialist for Linos Legal. Assess an inbound lead for a law firm.

Be practical and honest:
- Score higher when the matter is a clear fit, time-sensitive, and the prospect provided enough detail to act.
- Score lower when information is missing, the claim looks weak or out of scope, or expectations seem unrealistic.
- Set priority from real urgency signals (filing deadlines, statute of limitations, safety).
- List concrete risk flags and next steps.
- Recommend a retainer/fee: choose the structure typical for this matter type (e.g. contingency for personal injury, flat fee for simple filings, hourly for litigation) and a realistic dollar range. This is an advisory starting point — the attorney sets final terms.
- Never provide legal advice to the prospect; this assessment is for internal firm triage only.`,
      prompt: context,
    });
    return object;
  } catch (err) {
    console.error("Lead qualification failed:", err);
    return null;
  }
}
