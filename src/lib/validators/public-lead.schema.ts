import { z } from "zod";

export const publicLeadSchema = z.object({
  publicId: z.string().min(1, "Missing intake link id"),
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  caseType: z
    .enum([
      "CIVIL", "CRIMINAL", "FAMILY", "CORPORATE", "IMMIGRATION",
      "REAL_ESTATE", "BANKRUPTCY", "PERSONAL_INJURY", "OTHER",
    ])
    .default("OTHER"),
  description: z.string().optional().or(z.literal("")),
  // Opposing / adverse parties for the conflict check.
  adverseParties: z.array(z.string()).default([]),
  // Free-form questionnaire answers (branching by matter type).
  answers: z.record(z.string(), z.unknown()).optional(),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;
