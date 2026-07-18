import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  source: z
    .enum(["PHONE", "WEBSITE", "REFERRAL", "GOOGLE", "WALK_IN", "OTHER"])
    .default("PHONE"),
  caseType: z
    .enum([
      "CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "IMMIGRATION",
      "REAL_ESTATE", "BANKRUPTCY", "PERSONAL_INJURY", "OTHER",
    ])
    .default("OTHER"),
  description: z.string().optional().or(z.literal("")),
  adverseParties: z.array(z.string()).default([]),
});

export const updateLeadSchema = z.object({
  stage: z
    .enum(["NEW", "QUALIFYING", "QUALIFIED", "CONSULT_SCHEDULED", "ENGAGED", "CONVERTED", "DISQUALIFIED", "LOST"])
    .optional(),
  conflictStatus: z
    .enum(["PENDING", "CLEAR", "POTENTIAL", "CONFLICT", "WAIVED"])
    .optional(),
  notes: z.string().optional(),
  nextFollowUpAt: z.string().datetime().optional().or(z.literal("")),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
