import { z } from "zod";

export const intakeAnalysisSchema = z.object({
  suggestedCaseType: z
    .enum([
      "CIVIL",
      "CRIMINAL",
      "FAMILY",
      "CORPORATE",
      "IMMIGRATION",
      "REAL_ESTATE",
      "BANKRUPTCY",
      "PERSONAL_INJURY",
      "OTHER",
    ])
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
    .enum([
      "CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "IMMIGRATION",
      "REAL_ESTATE", "BANKRUPTCY", "PERSONAL_INJURY", "OTHER",
    ])
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
});

export type LeadQualification = z.infer<typeof leadQualificationSchema>;
