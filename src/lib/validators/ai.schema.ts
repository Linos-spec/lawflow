import { z } from "zod";
import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas/catalog";

export const intakeAnalysisSchema = z.object({
  suggestedCaseType: z
    .enum(PRACTICE_AREA_KEYS)
    .describe("The most appropriate case type based on the intake description"),
  estimatedPriority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .describe("Estimated priority level based on urgency indicators in the description"),
  riskFlags: z
    .array(z.string())
    .describe("Potential risk factors or concerns identified in the intake"),
  recommendedSteps: z
    .array(z.string())
    .describe("Recommended next steps for the firm to take"),
  summary: z
    .string()
    .describe("Brief 2-3 sentence summary of the intake and initial assessment"),
  conflictCheckNeeded: z
    .boolean()
    .describe("Whether a conflict of interest check is recommended"),
});

export type IntakeAnalysis = z.infer<typeof intakeAnalysisSchema>;

export const leadQualificationSchema = z.object({
  qualified: z
    .boolean()
    .describe(
      "Whether this lead looks like a viable matter worth the firm's time to pursue (based on fit, urgency, and completeness). Not a guarantee of representation."
    ),
  qualificationScore: z
    .number()
    .min(0)
    .max(100)
    .describe("0-100 score of how strong/promising this lead is"),
  suggestedCaseType: z
    .enum(PRACTICE_AREA_KEYS)
    .describe("Most appropriate case type based on the lead's description and answers"),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .describe("Urgency based on deadlines, statute-of-limitations, or safety indicators"),
  riskFlags: z
    .array(z.string())
    .describe("Red flags or concerns: missing info, unrealistic expectations, possible non-viable claim, urgency risks"),
  nextSteps: z
    .array(z.string())
    .describe("Concrete recommended next steps, e.g. 'Schedule consultation', 'Request documents'"),
  summary: z
    .string()
    .describe("2-3 sentence internal summary of the lead and the assessment"),
  retainer: z
    .object({
      structure: z.enum(["HOURLY", "FLAT_FEE", "CONTINGENCY"]).describe("Recommended fee structure for this matter type"),
      amountLow: z.number().int().min(0).describe("Suggested initial retainer / fee lower bound, in whole US dollars"),
      amountHigh: z.number().int().min(0).describe("Suggested initial retainer / fee upper bound, in whole US dollars"),
      rationale: z.string().describe("Brief reasoning for the recommended structure and range"),
    })
    .describe("Advisory retainer/fee recommendation based on matter type and complexity. The attorney sets the final terms."),
});

export type LeadQualification = z.infer<typeof leadQualificationSchema>;

export const documentAnalysisSchema = z.object({
  documentType: z
    .enum([
      "CONTRACT", "PLEADING", "COURT_FILING", "CORRESPONDENCE", "EVIDENCE",
      "DISCOVERY", "INVOICE", "IDENTIFICATION", "ENGAGEMENT_LETTER", "MEMO", "OTHER",
    ])
    .describe("The kind of legal document this is"),
  suggestedTitle: z
    .string()
    .describe("A clear, consistent title for this document (e.g. 'Smith v. Jones — Motion to Dismiss'). Fixes bad file names."),
  parties: z
    .array(z.string())
    .describe("People or organizations named as parties in the document"),
  tags: z
    .array(z.string())
    .describe("3-6 short lowercase tags for search/filtering (e.g. 'motion', 'confidential', 'signed')"),
  summary: z
    .string()
    .describe("1-2 sentence summary of what this document is"),
  containsSignature: z
    .boolean()
    .describe("Whether the document appears to be signed or contains signature blocks"),
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

export const matterPlanSchema = z.object({
  deadlines: z
    .array(
      z.object({
        title: z.string().describe("Short, concrete deadline/task, e.g. 'File statute of limitations complaint'"),
        deadlineType: z.enum([
          "FILING", "COURT_APPEARANCE", "DISCOVERY", "STATUTE_OF_LIMITATIONS",
          "CLIENT_MEETING", "INTERNAL", "OTHER",
        ]),
        dueInDays: z.number().int().min(1).max(3650).describe("Days from today this is due"),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
        rationale: z.string().describe("One line on why this matters for this matter type"),
      })
    )
    .max(8)
    .describe("Initial deadlines/tasks a competent firm would open for this matter. Suggestions only — the attorney verifies."),
});

export type MatterPlan = z.infer<typeof matterPlanSchema>;

export const caseIntelligenceSchema = z.object({
  summary: z.string().describe("2-4 sentence plain-English summary of the matter and its posture"),
  strengthScore: z.number().int().min(0).max(100).describe("How strong the client's position looks, 0-100"),
  strengthRationale: z.string().describe("One or two sentences on what drives the strength score"),
  riskScore: z.number().int().min(0).max(100).describe("Overall risk/exposure, 0-100 (higher = riskier)"),
  riskRationale: z.string().describe("One or two sentences on the key risks"),
  missingEvidence: z.array(z.string()).describe("Evidence or documentation that appears to be missing and should be gathered"),
  potentialDefenses: z.array(z.string()).describe("Potential defenses or counter-arguments to anticipate (suggestions only)"),
  nextSteps: z.array(z.string()).describe("Concrete recommended next actions"),
  recommendedDocuments: z.array(z.object({
    title: z.string(),
    why: z.string(),
  })).describe("Documents worth drafting or filing next, with why"),
  statutes: z.array(z.object({
    citation: z.string().describe("Statute citation, e.g. 'Cal. Civ. Code § 1550'"),
    relevance: z.string(),
  })).describe("Potentially relevant statutes — STARTING POINTS the attorney must verify, never authoritative"),
  caseLaw: z.array(z.object({
    citation: z.string().describe("Case citation, e.g. 'Palsgraf v. Long Island R.R., 248 N.Y. 339 (1928)'"),
    holding: z.string().describe("What the case is cited for"),
    relevance: z.string(),
  })).describe("Potentially relevant case law — UNVERIFIED AI suggestions that MUST be checked in a legal database before any reliance (LLMs invent citations)"),
});

export type CaseIntelligence = z.infer<typeof caseIntelligenceSchema>;
