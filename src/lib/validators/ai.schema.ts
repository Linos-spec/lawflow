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
